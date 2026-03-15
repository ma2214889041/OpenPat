import { useState } from 'react';
import { loadHistory, clearHistory } from '../utils/sessionHistory';
import './SessionHistory.css';

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function fmtDur(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function fmtTime(ts) {
  return new Date(ts).toLocaleString('zh-CN', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function SessionHistory({ onClose }) {
  const [history, setHistory] = useState(loadHistory);

  const handleClear = () => {
    clearHistory();
    setHistory([]);
  };

  return (
    <div className="session-history">
      <div className="sh-header">
        <span className="sh-title">历史会话</span>
        <div className="sh-actions">
          {history.length > 0 && (
            <button className="sh-clear" onClick={handleClear}>清空</button>
          )}
          <button className="sh-close" onClick={onClose}>✕</button>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="sh-empty">
          <p>暂无历史会话</p>
          <small>断开连接时会自动保存</small>
        </div>
      ) : (
        <div className="sh-list">
          {history.map(s => {
            const rate = s.toolCalls > 0
              ? ((s.toolCallsSuccess / s.toolCalls) * 100).toFixed(0) + '%'
              : '—';
            return (
              <div key={s.id} className={`sh-item ${s.errorCount > 0 ? 'has-errors' : ''}`}>
                <div className="sh-item-time">{fmtTime(s.startTime)}</div>
                <div className="sh-item-stats">
                  <span className="sh-tag">⏱ {fmtDur(s.durationMs)}</span>
                  <span className="sh-tag">🔢 {fmt(s.tokensInput + s.tokensOutput)}</span>
                  <span className="sh-tag">🛠 {s.toolCalls} ({rate})</span>
                  {s.errorCount > 0 && (
                    <span className="sh-tag error">❌ {s.errorCount}错误</span>
                  )}
                  {s.modelName && (
                    <span className="sh-tag model">{s.modelName.split('/').pop()}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
