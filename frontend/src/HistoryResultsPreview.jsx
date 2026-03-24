import { useState, useEffect } from "react";

function HistoryResultView({ curTitle, curImgInpt, curRefInpt, cancelCurrentDataPreview }) {

    const [rot1, setRot1] = useState(0);
    const [rot2, setRot2] = useState(0);
    

    useEffect(() => {
    const r1 = Math.floor(Math.random() * 30) - 15;
    const r2 = r1*(-1);
    setRot1(r1);
    setRot2(r2);
    }, []);
  
    return (
    <>
    <div className="historyResultPreviewAll">
        <button className="clearButtonOutside preview" onClick={cancelCurrentDataPreview}>×</button>
        <div className="resultFrames">
             <img src={curImgInpt} className="resultBox resultBoxAnimated" style={{ "--rot": `${rot1}deg` }} />
             <img src={curRefInpt} className="resultBox resultBoxAnimated2" style={{ "--rot": `${rot2}deg` }} />
        </div>

        <div className="blueFrame centerButton">
            <span className="buttonText">{curTitle}</span>
        </div>
      </div>
    </>
  );
}

export default HistoryResultView;