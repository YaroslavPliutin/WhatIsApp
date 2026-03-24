import { useState, useEffect } from "react";


function ResultView({ file, onReset, result }) {

    const [rot1, setRot1] = useState(0);
    const [rot2, setRot2] = useState(0);
    

    useEffect(() => {
    const r1 = Math.floor(Math.random() * 30) - 15;
    const r2 = r1*(-1);
    setRot1(r1);
    setRot2(r2);
    }, []);

    let resultWord = "";

    if (result) {
        const probability = result.confidence;

        if (probability > 0.8) {
            resultWord = `It's DEFINITELY a ${result.name}!`;
        } else if (probability > 0.5) {
            resultWord = `I'm sure it's a ${result.name}`;
        } else if (probability > 0.2) {
            resultWord = `It's a ${result.name}!`;
        } else {
            resultWord = `I'm not sure... maybe it's a ${result.name}`;
        }
    }
  
    return (
    <>
        <div className="resultFrames">
            <img src={URL.createObjectURL(file)} className="resultBox resultBoxAnimated" style={{ "--rot": `${rot1}deg` }} />
            <img src={result.reference_image} className="resultBox resultBoxAnimated2" style={{ "--rot": `${rot2}deg` }} />
        </div>

      <div className="resultWordBox">
        <span className="resultText">{resultWord}</span>
      </div>

      <div className="blueFrame againButton btnAnimated">
        <button className="whatButton" onClick={onReset}></button>
        <span className="buttonText">AGAIN</span>
      </div>
    </>
  );
}

export default ResultView;