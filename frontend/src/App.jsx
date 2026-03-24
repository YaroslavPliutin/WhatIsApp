import { useState, useEffect, useRef, useMemo } from "react";
import DropBox from "./DropBox";
import ResultView from "./Result";
import ErrorMes from "./ErrorMes";
import Header from "./Header";
import History from "./History";
import { fetchWithRefr } from "./api/fetchWithRefr";


function App() {
  const [file, setFile] = useState(null);
  const [rotation, setRot] = useState(0);
  const [mode, setMode] = useState("upload");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [user, setUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [prevMode, setPrevMode] = useState("upload");

  const [historyVisible, setHistoryVisible] = useState(false);
  const [centerBlockVisible, setCenterBlockVisible] = useState(true);
  const timeoutRef = useRef(null);


  const openHistory = () => {
    setMode("history");

    setTimeout(() => {
      setHistoryVisible(true);
    }, 10);
  };

  const closeHistory = () => {
    setHistoryVisible(false);

    clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setMode(prevMode);
    }, 250);
  };

  {/* Check user active */}
  useEffect(() => {
  async function checkUser() {
      try {
        const res = await fetchWithRefr(`${import.meta.env.VITE_API_UR}/me`, {
          credentials: "include"
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
        else {
          setUser(null);
        }
      } catch(e) {
        setUser(null);
      }
    }

    checkUser();
  }, []);

  {/* Disable user old refresh token */}
  useEffect(() => {
    const logout = () => setUser(null);

    window.addEventListener("auth:logout", logout);
    return () => window.removeEventListener("auth:logout", logout);
  }, []);
  
  const handleChange = (e) => {
    const selected = e.target.files[0];

    if(!selected) return;

    const MAX_SIZE = 10*1024*1024;

    if(selected.size > MAX_SIZE) {
      setErrorMessage(" Maximum file size 10MB");
      e.target.value = "";
      return;
    }

    if (selected) {
      setFile(selected);
    }
    const randomDeg = Math.floor(Math.random() * 30) - 15;
    setRot(randomDeg);
  };

  const handleAnalyze = async() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => { controller.abort(); }, 15000);
    if (!file) {
      setError(true);

      setTimeout(() => {
        setError(false);
      }, 400);

      return;
    }

    setLoading(true);

    const imageData = new FormData();
    imageData.append("file", file);

    try {
      const res = await fetchWithRefr(`${import.meta.env.VITE_API_UR}/upload`, {
        method: "POST",
        body: imageData,
        signal: controller.signal,
        credentials: "include"
      });

      const data = await res.json();

      if(data.error){
      setErrorMessage(data.error);
      handleReset();
      return;
      }

      if(!data.reference_image){
      setErrorMessage("Referance image not found");
      }

     if(!data.name){
      setErrorMessage("Unexpected server response");
      handleReset();
      return;
      }

      setResult(data);
      setMode("result");
      setPrevMode("result");
      clearTimeout(timeout);
      setLoading(false);

    } catch (error) {
      if (error.name === "AbortError") {
        setErrorMessage("Server timeout (15s)");
      } else {
        setErrorMessage("Server connection error");
      }
      setLoading(false);
      console.log("Error:", error);
      handleReset();
      };
  };  

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setMode("upload");
    setPrevMode("upload");
    return;
  };

  async function handleLogout() {
    await fetchWithRefr(`${import.meta.env.VITE_API_UR}/logout`, {
      method: "POST",
      credentials: "include"
    });

    setUser(null);
  }

  const questions = useMemo(() => {
    return Array.from({ length: 100 }).map(() => ({
      duration: 20 + Math.random() * 20,
      delay: Math.random() * 5,
      rotate: Math.random() * 360
    }));
  }, []);
  

  return (
    <>
    <div className="backQuestions">
      <div className="tempQuestionWraper">
        {questions.map((q, i) => (
          <span 
          className="backQuestionsText" 
          key={i} 
          style={{
            animationDuration: `${q.duration}s`,
            animationDelay: `${q.delay}s`,
            '--r': `${q.rotate}deg`
          }}
          >?</span>
        ))}
      </div>
    </div>

    <Header 
      menuOpen={menuOpen} 
      setMenuOpen={setMenuOpen} 
      user={user} 
      setUser={setUser} 
      handleLogout={handleLogout} 
      setMode={setMode} 
      setErrorMessage={setErrorMessage}
      openHistory={openHistory}
    />
    <div className="mainBlock">
        {errorMessage && (
            <ErrorMes message={errorMessage} onClose={() => setErrorMessage(null)} />
          )}
      
          {mode === "upload" && (
          <div className="centerContentBlock">
            <DropBox 
              setFile={setFile} 
              file={file} 
              setRot={setRot} 
              rotation={rotation} 
              handleChange={handleChange} 
              error={error} user={user} 
            />

            {file && !loading && (
            <button className="clearButtonOutside" 
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }} 
              disabled={loading}>×</button>
            )}

            {loading && <div className="loader" />}

            <div className="blueFrame centerButton btnAnimated">
              <button className="whatButton" onClick={handleAnalyze} disabled={loading}></button>
              <span className="buttonText">WHAT IS IT?</span>
            </div>
          </div>
          )}

          {mode === "result" && (
            <>
              <ResultView file={file} onReset={handleReset} result={result} prevMode={prevMode} setPrevMode={setPrevMode}/>
            </>
          )}
       
        {mode === "history" && (
          <>
            <History 
              setMode={setMode} 
              user={user} 
              setUser={setUser} 
              setErrorMessage={setErrorMessage} 
              prevMode={prevMode} 
              menuOpen={menuOpen}  
              setMenuOpen={setMenuOpen}
              historyVisible={historyVisible}
              closeHistory={closeHistory}
            />
          </>
        )}

      </div>
    </>
  );
}

export default App;