import { useState, useCallback } from 'react';
import './ConnectModal.css';

// Common connection presets
const PRESETS = [
  { label: '本机 (默认)',  url: 'ws://localhost:18789' },
  { label: 'SSH 隧道',    url: 'ws://127.0.0.1:18789' },
];

// Try to auto-detect from the npx openpat CLI config file
async function tryAutoDetect() {
  try {
    const r = await fetch('/lobster-config.json', { cache: 'no-store' });
    if (!r.ok) return null;
    const cfg = await r.json();
    if (cfg.wsUrl && cfg.token) return { url: cfg.wsUrl, token: cfg.token };
  } catch { /* not available */ }
  return null;
}

// Try to ping a WebSocket URL to see if gateway is there
async function pingGateway(wsUrl) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => { ws.close(); resolve(false); }, 3000);
    let ws;
    try { ws = new WebSocket(wsUrl); } catch { clearTimeout(timer); resolve(false); return; }
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        // Gateway sends {type:"event", event:"connect.challenge"} or legacy {type:"hello-ok"}
        const isChallenge = msg.type === 'event' && msg.event === 'connect.challenge';
        const isHello = msg.type === 'hello-ok' || (msg.type === 'res' && msg.payload?.type === 'hello-ok');
        if (isChallenge || isHello) {
          clearTimeout(timer); ws.close(); resolve(true);
        }
      } catch { /* ignore */ }
    };
    ws.onerror = () => { clearTimeout(timer); resolve(false); };
  });
}

export default function ConnectModal({ onConnect, onSkip }) {
  const [url,      setUrl]      = useState('ws://localhost:18789');
  const [token,    setToken]    = useState('');
  const [detecting, setDetecting] = useState(false);
  const [detectMsg, setDetectMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    onConnect(url.trim(), token.trim());
  };

  const handleAutoDetect = useCallback(async () => {
    setDetecting(true);
    setDetectMsg('检测中...');

    // 1. Try CLI config file first
    const cfg = await tryAutoDetect();
    if (cfg) {
      setUrl(cfg.url);
      setToken(cfg.token);
      setDetectMsg('✅ 自动检测成功！已填入配置');
      setDetecting(false);
      return;
    }

    // 2. Probe default local ports
    const candidates = ['ws://localhost:18789', 'ws://127.0.0.1:18789'];
    for (const candidate of candidates) {
      setDetectMsg(`探测 ${candidate}...`);
      const alive = await pingGateway(candidate);
      if (alive) {
        setUrl(candidate);
        setDetectMsg('✅ 找到 Gateway！填入 Token 后连接');
        setDetecting(false);
        return;
      }
    }

    setDetectMsg('❌ 未检测到 Gateway，请手动填写');
    setDetecting(false);
  }, []);

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-logo">🦞</span>
          <h1>OpenPat</h1>
          <p>连接你的 OpenClaw Agent，让它变成一只会动的虚拟伙伴</p>
        </div>

        {/* Auto-detect */}
        <div className="modal-autodetect">
          <button
            type="button"
            className="autodetect-btn"
            onClick={handleAutoDetect}
            disabled={detecting}
          >
            {detecting ? '⏳ 检测中...' : '⚡ 自动检测'}
          </button>
          {detectMsg && <span className="detect-msg">{detectMsg}</span>}
        </div>

        <div className="modal-divider">或手动填写</div>

        <form onSubmit={handleSubmit} className="modal-form">

          {/* URL presets */}
          <div className="preset-row">
            {PRESETS.map(p => (
              <button
                key={p.url}
                type="button"
                className={`preset-chip${url === p.url ? ' preset-chip--active' : ''}`}
                onClick={() => setUrl(p.url)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <label>
            <span>Gateway 地址</span>
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
              placeholder="从 openclaw.json 中复制"
            />
            <small>Token 仅存本地，不会上传</small>
          </label>

          <details className="modal-help">
            <summary>三种连接方式</summary>
            <div className="help-body">
              <p>🖥 方式 A — 命令行一键启动（推荐本地）</p>
              <code>npx openpat</code>
              <p>会自动读取 OpenClaw 配置并写入 /lobster-config.json，点「自动检测」即可完成连接。</p>
              <p>📋 方式 B — 手动填写（适合任何场景）</p>
              <code>cat ~/.openclaw/openclaw.json | grep token</code>
              <p>把 gateway.auth.token 的值填到上面的 Token 框。</p>
              <p>🌐 方式 C — SSH 隧道（连接远程服务器）</p>
              <code>ssh -N -L 18789:127.0.0.1:18789 user@host</code>
              <p>隧道建好后选「SSH 隧道」预设，填远程 Token。</p>
            </div>
          </details>

          <button type="submit" className="connect-btn">
            🦞 开始连接
          </button>

          {onSkip && (
            <button type="button" className="skip-btn" onClick={onSkip}>
              先看看演示
            </button>
          )}
        </form>

        <div className="modal-footer">
          <p>需要 <a href="https://openclaw.ai" target="_blank" rel="noreferrer">OpenClaw</a> Gateway 运行中</p>
        </div>
      </div>
    </div>
  );
}
