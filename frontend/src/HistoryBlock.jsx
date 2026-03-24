import { useState } from "react";
import { fetchWithRefr } from "./api/fetchWithRefr";

function HistoryBlock({ loading, id, inputImg, refImg, title, handleDeleteLocal, setErrorMessage, setCurrentDataPreview }) {
    const [deleteMenu, setDeletemenu] = useState(false);
    

    const handleDelete = async () => {
      try {
        const res = await fetchWithRefr(`${import.meta.env.VITE_API_UR}/history/${id}`, {
          method: "DELETE",
          credentials: "include"
        });

        if (res.status === 404) {
          setErrorMessage("Log in first");
          setUser(null);
          setMenuOpen(false);
          setMode("upload"); 
          return;
        }

        handleDeleteLocal(id);
      } catch (e) {
        console.error(e);
      }
    };

    if (loading) {
      return <div className="loader historyLoader"></div>;
    }

  return (
    <div className="historyBlock btnAnimated" onClick={ () => setCurrentDataPreview(title, inputImg, refImg)} >
      <div className="historyBlockImages">
       
          <img src={inputImg} className="historyBlockImg left" />
          <img src={refImg} className="historyBlockImg right" />
        
      </div>
        
      <div className="blockHistoryTitleFrame"><span className="blockHistoryTitleText">{title}</span></div>
        
      <div className="menuButton menuOpen blockClose btnAnimated">
        <span className="menuIconText blockCloseText" onClick={(e) => {
          e.stopPropagation();
          setDeletemenu(!deleteMenu);
        }}>
        ✕
        </span>
      </div>

      {deleteMenu && (
        <div className="deleteFull">
          <span className="blockHistoryTitleText deleteWindow titleText">Delete?</span>

          <div className="deleteFrame">
            <div className="deleteWindowButtonsFrames btnAnimated" onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}>
              <span className="blockHistoryTitleText deleteWindow">Yes</span>
            </div>
            <div className="deleteWindowButtonsFrames btnAnimated" onClick={(e) => {
              e.stopPropagation();
              setDeletemenu(false);
            }}>
              <span className="blockHistoryTitleText deleteWindow">No</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HistoryBlock;