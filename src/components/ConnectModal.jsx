import { useState, useCallback } from 'react';
import './ConnectModal.css';

// Common connection presets
const PRESETS = [
  { label: '本机 (默认)',  url: 'ws://localhost:18789' },
  { label: 'SSH 隧道',    url: 'ws://127.0.0.1:18789' },
];

// Try to auto-detect from the npx open-pat CLI config file
async function tryAutoDetect() {
  try {
    const r = await fetch('http://localhost:4242/pet-config.json', { cache: 'no-store' });
    if (!r.ok) return null;
    const cfg = await r.json();
    if (cfg.wsUrl && cfg.token) return { url: cfg.wsUrl, token: cfg.token };
  } catch { /* not available */ }
  return null;
}

// Try to ping a WebSocket URL to see if gateway is there
async function pingGateway(wsUrl) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      try { ws.close(); } catch { /* ok */ }
      resolve(false);
    }, 4000);
    let ws;
    try { ws = new WebSocket(wsUrl); } catch { clearTimeout(timer); resolve(false); return; }
    ws.onopen = () => {
      // Connection opened — wait for challenge message
    };
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        // Gateway sends {type:"event", event:"connect.challenge"} (v3 protocol)
        // or legacy {type:"hello-ok"}
        const isChallenge = msg.type === 'event' && msg.event === 'connect.challenge';
        const isHello = msg.type === 'hello-ok' || (msg.type === 'res' && msg.payload?.type === 'hello-ok');
        if (isChallenge || isHello) {
          clearTimeout(timer);
          try { ws.close(); } catch { /* ok */ }
          resolve(true);
        }
      } catch { /* ignore */ }
    };
    ws.onerror = () => { clearTimeout(timer); resolve(false); };
    ws.onclose = () => { clearTimeout(timer); };
  });
}

export default function ConnectModal({ onConnect, onSkip }) {
  const [url,      setUrl]      = useState('ws://localhost:18789');
  const [token,    setToken]    = useState('');
  const [detecting, setDetecting] = useState(false);
  const [detectMsg, setDetectMsg] = useState('');
  const [showManual, setShowManual] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    onConnect(url.trim(), token.trim());
  };

  const handleAutoDetect = useCallback(async () => {
    setDetecting(true);
    setDetectMsg('检测中...');

    // 1. Try Vite dev API / CLI bridge
    const sources = ['/api/gateway-config', 'http://localhost:4242/pet-config.json'];
    for (const src of sources) {
      try {
        const cfg = await (await fetch(src)).json();
        if (cfg.autoDetected && cfg.wsUrl && cfg.token) {
          setDetectMsg('✅ 自动检测成功！');
          setDetecting(false);
          onConnect(cfg.wsUrl, cfg.token);
          return;
        }
      } catch { /* next */ }
    }

    // 2. Try auto-detect via CLI config
    const cfg = await tryAutoDetect();
    if (cfg) {
      setDetectMsg('✅ 自动检测成功！');
      setDetecting(false);
      onConnect(cfg.url, cfg.token);
      return;
    }

    // 3. Probe default gateway
    const candidates = ['ws://localhost:18789', 'ws://127.0.0.1:18789'];
    for (const candidate of candidates) {
      setDetectMsg(`探测 ${candidate}...`);
      const alive = await pingGateway(candidate);
      if (alive) {
        setUrl(candidate);
        setDetectMsg('✅ 找到 Gateway！填入 Token 后连接');
        setShowManual(true);
        setDetecting(false);
        return;
      }
    }

    setDetectMsg('❌ 未检测到 Gateway');
    setDetecting(false);
  }, [onConnect]);

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-logo">🐾</span>
          <h1>OpenPat</h1>
          <p>连接你的 AI Agent，让它变成一只有智力的数字宠物</p>
        </div>

        {/* Primary: one command */}
        <div className="modal-quickstart">
          <p className="quickstart-label">在终端运行一条命令即可连接：</p>
          <div className="quickstart-code" onClick={() => {
            navigator.clipboard?.writeText('npx open-pat');
          }}>
            <code>npx open-pat</code>
            <span className="copy-hint">点击复制</span>
          </div>
          <p className="quickstart-desc">自动检测 Agent 配置，打开浏览器一键连接</p>
        </div>

        {/* Auto-detect button */}
        <div className="modal-autodetect">
          <button
            type="button"
            className="autodetect-btn"
            onClick={handleAutoDetect}
            disabled={detecting}
          >
            {detecting ? '⏳ 检测中...' : '⚡ 已运行？点击自动连接'}
          </button>
          {detectMsg && <span className="detect-msg">{detectMsg}</span>}
        </div>

        {/* Manual fallback (collapsed by default) */}
        {!showManual && (
          <button type="button" className="toggle-manual" onClick={() => setShowManual(true)}>
            手动填写 ▾
          </button>
        )}

        {showManual && (
          <form onSubmit={handleSubmit} className="modal-form">
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
                placeholder="从配置文件中复制"
              />
              <small>Token 仅存本地，不会上传</small>
            </label>

            <button type="submit" className="connect-btn">
              🐾 开始连接
            </button>
          </form>
        )}

        {onSkip && (
          <button type="button" className="skip-btn" onClick={onSkip}>
            先看看演示
          </button>
        )}

        <div className="modal-footer">
          <p>需要 <a href="https://open-pat.com" target="_blank" rel="noreferrer">Agent</a> Gateway 运行中</p>
        </div>
      </div>
    </div>
  );
}
