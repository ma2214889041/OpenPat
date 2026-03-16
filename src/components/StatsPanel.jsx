import { useState } from 'react';
import './StatsPanel.css';
import { STATES } from '../hooks/useGateway';

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function fmtTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

const STATUS_LABELS = {
  [STATES.OFFLINE]: '离线',
  [STATES.IDLE]: '空闲',
  [STATES.THINKING]: '思考中',
  [STATES.TOOL_CALL]: '调用中',
  [STATES.DONE]: '完成',
  [STATES.ERROR]: '报错',
  [STATES.TOKEN_EXHAUSTED]: 'Token耗尽',
};

const STATUS_COLORS = {
  [STATES.OFFLINE]: '#94a3b8',
  [STATES.IDLE]: '#22c55e',
  [STATES.THINKING]: '#f59e0b',
  [STATES.TOOL_CALL]: '#3b82f6',
  [STATES.DONE]: '#10b981',
  [STATES.ERROR]: '#ef4444',
  [STATES.TOKEN_EXHAUSTED]: '#f97316',
};

export default function StatsPanel({ status, stats, totalTasks }) {
  const [expanded, setExpanded] = useState(false);
  const totalTokens = stats.tokensInput + stats.tokensOutput;
  const successRate = stats.toolCalls > 0
    ? ((stats.toolCallsSuccess / stats.toolCalls) * 100).toFixed(1) + '%'
    : '—';

  return (
    <div className="stats-bar-wrapper">
      <button className="stats-bar" onClick={() => setExpanded(v => !v)}>
        <span className="stat-badge" style={{ '--color': STATUS_COLORS[status] }}>
          <span className="stat-dot" />
          {STATUS_LABELS[status]}
        </span>
        <span className="stat-chip">🔢 {fmt(totalTokens)}</span>
        <span className="stat-chip">🛠 {stats.toolCalls}</span>
        <span className="stat-chip">⏱ {stats.sessionStart ? fmtTime(stats.uptime) : '—'}</span>
        <span className="stat-expand">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="stats-detail">
          <div className="sd-row">
            <span className="sd-label">Input tokens</span>
            <span className="sd-val">{fmt(stats.tokensInput)}</span>
          </div>
          <div className="sd-row">
            <span className="sd-label">Output tokens</span>
            <span className="sd-val">{fmt(stats.tokensOutput)}</span>
          </div>
          <div className="sd-row">
            <span className="sd-label">成功率</span>
            <span className="sd-val">{successRate}</span>
          </div>
          {stats.modelName && (
            <div className="sd-row">
              <span className="sd-label">模型</span>
              <span className="sd-val">{stats.modelName}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
