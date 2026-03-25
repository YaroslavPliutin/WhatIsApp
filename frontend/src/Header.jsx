import { GoogleLogin } from "@react-oauth/google";
import googleIcon from "./assets/Google__G__logo.svg.png";
import { useRef, useEffect } from "react";
import { fetchWithRefr } from "./api/fetchWithRefr";

function Header({ menuOpen, setMenuOpen, user, setUser, handleLogout, setMode, setErrorMessage, openHistory }) {

    const menuRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (e) => {
        if (menuRef.current && !menuRef.current.contains(e.target)) {
          setMenuOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    async function handleGoogleSuccess(credentialResponse) {
        const token = credentialResponse.credential;

        try {
            const res = await fetchWithRefr(`${import.meta.env.VITE_API_UR}/auth/google`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ token }),
            });

            const meRes = await fetchWithRefr(`${import.meta.env.VITE_API_UR}/me`, {
              credentials: "include"
            });

            if (res.status === 500) {
              setErrorMessage("Server error");
              return;
            }

            const meData = await meRes.json();
            setMenuOpen(false);
            setUser(meData);
            

        } catch (error) {
            console.error("Auth error:", error);
        }
    }

  return (
    <div className="header">
      <div className="dropBoxFull">

        {menuOpen &&(
        <div className={`menuButton menuOpen dropDownMenuTemp btnAnimated`} onClick={() => setMenuOpen(!menuOpen)} >
          <span className="menuIconText">✕</span>
        </div>
        )}
        {!menuOpen &&(
        <div className={`menuButton btnAnimated`} onClick={() => setMenuOpen(!menuOpen)} >
          <span className="menuIconText">≡</span>
        </div>
        )}
        
        
          <div ref={menuRef} className={`dropdownBox ${menuOpen ? "open" : "closed"}`}>
            {!user ? (
              <>
                <div className="dropDownInnerBoxTitle "><span className="dropDownInnerTextTitle">Login</span></div>
                <div className="dropDownInnerBoxMain btnAnimated googleWrapper">
                  <span className="OAuthFrame">
                    <img src={googleIcon} className="OAuthIconGoogle" />
                  </span>
                  <span className="dropDownInnerTextMain">Google</span>
                  <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => console.log("Login Failed")} />
                </div>
              </>
            ) : (
              <>
                <div className="dropDownInnerBoxTitle "><span className="dropDownInnerTextTitle">{user.name}</span></div>
                <button className="dropDownInnerBoxMain btnAnimated" onClick={() => {openHistory(); setMenuOpen(false);}} ><span className="dropDownInnerTextMain">History</span></button>
                <button className="dropDownInnerBoxMain btnAnimated" onClick={() => {handleLogout(); setMode("upload"); setMenuOpen(false);}}><span className="dropDownInnerTextMain">LogOut</span></button>
              </>
            )}
          </div>
      
      </div>
    </div>
  );
}

export default Header;