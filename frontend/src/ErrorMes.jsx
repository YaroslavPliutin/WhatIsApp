function ErrorMes({ message, onClose }) {
  return (
    <div className="errorBox">
      <span className="errorText">{message}</span>
      <button className="errorButton" onClick={onClose}>✕</button>
    </div>
  );
}

export default ErrorMes;