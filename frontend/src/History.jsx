import HistoryBlock from "./HistoryBlock";
import HistoryResultView from "./HistoryResultsPreview";
import { useRef, useEffect, useState, use } from "react";
import { fetchWithRefr } from "./api/fetchWithRefr";

function History({ setMode, user, setUser, setErrorMessage, mode, prevMode, menuOpen, setMenuOpen, historyVisible, closeHistory }) {
  const contentRef = useRef(null);
  const thumbRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [showScrollbar, setShowScrollbar] = useState(false);
  const [loading, setLoading] = useState(true);
  
  
  const [showPreview, setShowPreview]= useState(false);

  const [curTitle, setCurTitle] = useState(null);
  const [curImgInpt, setCurImgInpt] = useState(null);
  const [curRefInpt, setCurRefInpt] = useState(null);

  const setCurrentDataPreview = (curTitle, curImgInpt, curRefInpt) =>{
    setCurTitle(curTitle);
    setCurImgInpt(curImgInpt);
    setCurRefInpt(curRefInpt);

    setShowPreview(true);
  }

  const cancelCurrentDataPreview = () =>{
    setCurTitle(null);
    setCurImgInpt(null);
    setCurRefInpt(null);

    setShowPreview(false);
  }


  
  

  {/* DB history code */}
  useEffect(() => {
    if (!user){
      setErrorMessage("Log in first")
      return;
    }

    const fetchHistory = async () => {
      try {
        const res = await fetchWithRefr(`${import.meta.env.VITE_API_UR}/history`, {
          credentials: "include"
        });

        if (res.status === 401) {
          setErrorMessage("Log in first");
          setUser(null);
          setMenuOpen(false);
          setMode("upload"); 
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (e) {
        setErrorMessage("Can't get history data")
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  {/* Scroll bar visability */}
  useEffect(() => {
    if (!contentRef.current) return;

    const el = contentRef.current;

    const checkScroll = () => {
      if(!el) return;

      if (el.scrollHeight > el.clientHeight) {
        
        setShowScrollbar(true);
      } else {
        
        setShowScrollbar(false);
      }
    };

    checkScroll();

    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(el);

    return () => resizeObserver.disconnect();
  }, [history]);

  const handleDeleteLocal = (id) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  {/* Scroll bar code */}
  useEffect(() => {
      const el = contentRef.current;

      if(!el) return;

      const thumb = thumbRef.current;

      if (!thumb) return;

      const track = thumb.parentElement;

      const handleScroll = () => {

        const maxScroll = el.scrollHeight - el.clientHeight;
        if (maxScroll <= 0) {
          thumb.style.transform = "translateY(0px)";
          thumb.style.height = `${track.clientHeight}px`;
          return;
        }

        const scrollRatio = el.scrollTop / maxScroll;


        const thumbHeight =(el.clientHeight / el.scrollHeight) * track.clientHeight;

        thumb.style.height = `${thumbHeight}px`;


        const maxMove = track.clientHeight - thumbHeight;

        const y = Math.min(Math.max(scrollRatio * maxMove, 0), maxMove);

        thumb.style.transform = `translateY(${y}px)`;
      };

      const handleResize = () => {
        handleScroll();
      };


      handleScroll();

      el.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", handleResize);
    

    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.addEventListener("resize", handleResize);
    }
  }, [history]);
  
  return (
    <>
    <div className={`historyFull ${historyVisible ? "open done" : "close"}`}>

      <div className="historyHeader">
        <div className="historyInnerBoxTitle"><span className="historyInnerTextTitle">History</span></div>

        <div className="menuButton menuOpen menuHistory btnAnimated" onClick={closeHistory}>
          <span className="menuIconText historyIconText">✕</span>
        </div>
      </div>

      <div className="historyContent" ref={contentRef}>
        {loading ?
          Array.from({ length: 6 }).map((_, i) => (
            <HistoryBlock key={i} loading={true} />
          ))
          :
          history.map((item) => (
            <HistoryBlock 
              loading={loading}
              key={item.id}
              id={item.id} 
              inputImg={item.input_image} 
              refImg={item.reference_image} 
              title={item.result} 
              handleDeleteLocal={handleDeleteLocal} 
              setErrorMessage={setErrorMessage}
              setCurrentDataPreview ={setCurrentDataPreview}
              />
          ))
        }
      </div>

      {showScrollbar &&(
      <div className="customScrollbar">
        <div className="scrollBar" ref={thumbRef}></div>
      </div>
      )}
    </div>

    {showPreview &&(
        <HistoryResultView 
        curTitle={curTitle}
        curImgInpt={curImgInpt}
        curRefInpt={curRefInpt}

        cancelCurrentDataPreview={cancelCurrentDataPreview}
        />
      )}
    </>
  );
}

export default History;