import { useState } from "react";

function DropBox({ file, setFile, rotation, setRot, handleChange, error }) {
  const [dragActive, setDragActive] = useState(false);

  return (
    <div
      className={`blueFrame dropBox ${dragActive ? "dragActive" : ""} ${error ? "errorTilt" : ""} btnAnimated`}
      onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); setDragActive(false); 
        const droppedFile = e.dataTransfer.files[0];
        if(droppedFile) {
            setFile(droppedFile)
            const randomDeg = Math.floor(Math.random() * 30) - 15;
            setRot(randomDeg);
        }
        }}
    >
      <input type="file" className="imageInput" accept="image/*" onChange={handleChange} />
        {file ? (
          <img src={URL.createObjectURL(file)} className="previewImage" style={{ transform : `rotate(${rotation}deg)`}} />
        ) : (
          <span className="dropText">Drop your image here</span>
        )}
    </div>
  );
}

export default DropBox;