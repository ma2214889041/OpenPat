import './ErrorLog.css';

export default function ErrorLog({ errors, onClose }) {
  if (!errors.length) return <div className="error-log empty"><p>暂无错误记录 ✅</p><button onClick={onClose}>关闭</button></div>;
  return (
    <div className="error-log">
      <div className="error-log-header">
        <span>最近 {errors.length} 条错误</span>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
      <ul className="error-list">
        {errors.map((e, i) => (
          <li key={i} className="error-item">
            <span className="error-time">{new Date(e.time).toLocaleTimeString()}</span>
            <span className="error-msg">{e.msg}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
