import { useState } from 'react';
import './StatsPanel.css';
import { fmt, fmtTime } from '../utils/format';
import { STATUS_LABELS, STATUS_COLORS } from '../utils/constants';

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
