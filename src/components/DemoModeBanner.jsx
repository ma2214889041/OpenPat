import './DemoModeBanner.css';

export default function DemoModeBanner({ onConnect }) {
  return (
    <div className="demo-banner">
      <span className="demo-tag">DEMO</span>
      <span className="demo-text">演示模式 — 拍拍在表演给你看</span>
      <button className="demo-connect" onClick={onConnect}>
        🔌 连接真实 Agent
      </button>
    </div>
  );
}
