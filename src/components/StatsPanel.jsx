import './StatsPanel.css';
import { LEVELS, getLevel } from '../utils/storage';
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
  [STATES.TOOL_CALL]: '工具调用中',
  [STATES.DONE]: '任务完成',
  [STATES.ERROR]: '报错了',
  [STATES.TOKEN_EXHAUSTED]: 'Token 耗尽',
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

export default function StatsPanel({ status, stats, currentTool, totalTasks, showModel, onToggleModel }) {
  const levelIdx = getLevel(totalTasks);
  const level = LEVELS[levelIdx];
  const successRate = stats.toolCalls > 0
    ? ((stats.toolCallsSuccess / stats.toolCalls) * 100).toFixed(1)
    : '—';

  return (
    <div className="stats-panel">
      {/* Status badge */}
      <div className="status-badge" style={{ '--color': STATUS_COLORS[status] }}>
        <span className="status-dot" />
        <span className="status-label">{STATUS_LABELS[status]}</span>
      </div>

      {/* Level */}
      <div className="level-row">
        <span className="level-emoji">🦞</span>
        <span className="level-name">{level.name}</span>
        <span className="level-tasks">{fmt(totalTasks)} tasks</span>
      </div>

      {/* Current tool */}
      {currentTool && (
        <div className="current-tool">
          <span className="tool-label">调用中：</span>
          <code className="tool-name">{currentTool.name}</code>
          <span className="tool-time">{fmtTime(Math.floor((Date.now() - currentTool.start) / 1000))}</span>
        </div>
      )}

      {/* Stats grid */}
      <div className="stats-grid">
        <div className="stat">
          <div className="stat-value">{fmt(stats.tokensInput)}</div>
          <div className="stat-label">input tokens</div>
        </div>
        <div className="stat">
          <div className="stat-value">{fmt(stats.tokensOutput)}</div>
          <div className="stat-label">output tokens</div>
        </div>
        <div className="stat">
          <div className="stat-value">{stats.toolCalls}</div>
          <div className="stat-label">工具调用</div>
        </div>
        <div className="stat">
          <div className="stat-value">{successRate}{stats.toolCalls > 0 ? '%' : ''}</div>
          <div className="stat-label">成功率</div>
        </div>
        <div className="stat">
          <div className="stat-value">{stats.sessionStart ? fmtTime(stats.uptime) : '—'}</div>
          <div className="stat-label">运行时长</div>
        </div>
        <div className="stat clickable" onClick={onToggleModel}>
          <div className="stat-value model-val">
            {showModel ? (stats.modelName || '—') : '● ● ●'}
          </div>
          <div className="stat-label">模型 {showModel ? '🙈' : '👁'}</div>
        </div>
      </div>
    </div>
  );
}
