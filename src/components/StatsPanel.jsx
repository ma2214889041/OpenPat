import { useState } from 'react';
import './StatsPanel.css';
import { fmt, fmtTime } from '../utils/format';
import { STATUS_LABELS, STATUS_COLORS, COMPANION_STATUS_LABELS } from '../utils/constants';

function fmtMinutes(min) {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function StatsPanel({ status, stats, totalTasks, source = 'companion', pomodoroData }) {
  const [expanded, setExpanded] = useState(false);

  if (source === 'agent') {
    // Agent mode — show original token-based stats
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
            <div className="sd-row"><span className="sd-label">Input tokens</span><span className="sd-val">{fmt(stats.tokensInput)}</span></div>
            <div className="sd-row"><span className="sd-label">Output tokens</span><span className="sd-val">{fmt(stats.tokensOutput)}</span></div>
            <div className="sd-row"><span className="sd-label">成功率</span><span className="sd-val">{successRate}</span></div>
            {stats.modelName && <div className="sd-row"><span className="sd-label">模型</span><span className="sd-val">{stats.modelName}</span></div>}
          </div>
        )}
      </div>
    );
  }

  // Companion mode — pomodoro-based stats
  const pom = pomodoroData || {};
  return (
    <div className="stats-bar-wrapper">
      <button className="stats-bar" onClick={() => setExpanded(v => !v)}>
        <span className="stat-badge" style={{ '--color': STATUS_COLORS[status] }}>
          <span className="stat-dot" />
          {COMPANION_STATUS_LABELS[status] || STATUS_LABELS[status]}
        </span>
        <span className="stat-chip">🍅 {pom.completedPomodoros || 0}</span>
        <span className="stat-chip">✅ {pom.todayTodosCompleted || 0}</span>
        <span className="stat-chip">⏱ {fmtMinutes(pom.todayFocusMinutes || 0)}</span>
        <span className="stat-expand">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="stats-detail">
          <div className="sd-row"><span className="sd-label">今日番茄</span><span className="sd-val">{pom.completedPomodoros || 0} 个</span></div>
          <div className="sd-row"><span className="sd-label">今日专注</span><span className="sd-val">{fmtMinutes(pom.todayFocusMinutes || 0)}</span></div>
          <div className="sd-row"><span className="sd-label">今日完成任务</span><span className="sd-val">{pom.todayTodosCompleted || 0} 个</span></div>
          <div className="sd-row"><span className="sd-label">累计番茄</span><span className="sd-val">{pom.totalPomodoros || 0} 个</span></div>
          <div className="sd-row"><span className="sd-label">累计专注</span><span className="sd-val">{fmtMinutes(pom.totalFocusMinutes || 0)}</span></div>
          <div className="sd-row"><span className="sd-label">累计完成任务</span><span className="sd-val">{totalTasks} 个</span></div>
        </div>
      )}
    </div>
  );
}
