import { useState } from 'react';
import './ConnectModal.css';

export default function ConnectModal({ onConnect }) {
  const [url, setUrl] = useState('ws://localhost:18789');
  const [token, setToken] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    onConnect(url.trim(), token.trim());
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-logo">🦞</span>
          <h1>OpenPat</h1>
          <p>连接你的 OpenClaw Agent，让它变成一只会动的虚拟龙虾</p>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            <span>Gateway WebSocket 地址</span>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="ws://localhost:18789"
              spellCheck={false}
            />
          </label>

          <label>
            <span>Gateway Token</span>
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="从 ~/.openclaw/openclaw.json 中获取"
            />
            <small>
              Token 仅保存在本地，不会上传到任何服务器
            </small>
          </label>

          <div className="modal-hint">
            <code>cat ~/.openclaw/openclaw.json | grep token</code>
          </div>

          <button type="submit" className="connect-btn">
            🦞 开始养虾
          </button>
        </form>

        <div className="modal-footer">
          <p>或者用 <code>npx openpat</code> 自动检测 Token</p>
        </div>
      </div>
    </div>
  );
}
