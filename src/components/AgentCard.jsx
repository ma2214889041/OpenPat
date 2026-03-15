import { useGateway, STATES } from '../hooks/useGateway';
import './AgentCard.css';

const STATUS_EMOJI = {
  [STATES.OFFLINE]: '😴',
  [STATES.IDLE]: '😌',
  [STATES.THINKING]: '🤔',
  [STATES.TOOL_CALL]: '⚡',
  [STATES.DONE]: '🎉',
  [STATES.ERROR]: '😵',
  [STATES.TOKEN_EXHAUSTED]: '💸',
};

const STATUS_COLOR = {
  [STATES.OFFLINE]: '#475569',
  [STATES.IDLE]: '#22c55e',
  [STATES.THINKING]: '#f59e0b',
  [STATES.TOOL_CALL]: '#3b82f6',
  [STATES.DONE]: '#10b981',
  [STATES.ERROR]: '#ef4444',
  [STATES.TOKEN_EXHAUSTED]: '#f97316',
};

const STATUS_LABEL = {
  [STATES.OFFLINE]: '离线',
  [STATES.IDLE]: '空闲',
  [STATES.THINKING]: '思考中',
  [STATES.TOOL_CALL]: '工具调用',
  [STATES.DONE]: '完成',
  [STATES.ERROR]: '报错',
  [STATES.TOKEN_EXHAUSTED]: 'Token耗尽',
};

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

// Mini animated lobster SVG that reacts to status
function MiniLobster({ status, primary = '#e8401c' }) {
  return (
    <div className={`mini-lobster mini-lobster--${status}`}>
      <svg viewBox="0 0 100 110" width="80" height="88" overflow="visible">
        {/* Body */}
        <ellipse cx="50" cy="65" rx="21" ry="26" fill={primary} className="ml-body" />
        {/* Head */}
        <ellipse cx="50" cy="40" rx="16" ry="14" fill={primary} />
        {/* Eyes */}
        <circle cx="43" cy="34" r="5" fill="white" />
        <circle cx="57" cy="34" r="5" fill="white" />
        <circle cx="44" cy="35" r="3" fill="#1a1a2e" className="ml-pupil-l" />
        <circle cx="58" cy="35" r="3" fill="#1a1a2e" className="ml-pupil-r" />
        {/* Antennae */}
        <line x1="42" y1="29" x2="28" y2="10" stroke={primary} strokeWidth="1.5" strokeLinecap="round" className="ml-ant-l" />
        <line x1="58" y1="29" x2="72" y2="10" stroke={primary} strokeWidth="1.5" strokeLinecap="round" className="ml-ant-r" />
        {/* Claws */}
        <line x1="32" y1="55" x2="17" y2="47" stroke={primary} strokeWidth="5" strokeLinecap="round" className="ml-claw-l" />
        <ellipse cx="12" cy="43" rx="6" ry="3.5" fill={primary} transform="rotate(-20,12,43)" />
        <ellipse cx="12" cy="51" rx="6" ry="3" fill="#c83010" transform="rotate(15,12,51)" />
        <line x1="68" y1="55" x2="83" y2="47" stroke={primary} strokeWidth="5" strokeLinecap="round" className="ml-claw-r" />
        <ellipse cx="88" cy="43" rx="6" ry="3.5" fill={primary} transform="rotate(20,88,43)" />
        <ellipse cx="88" cy="51" rx="6" ry="3" fill="#c83010" transform="rotate(-15,88,51)" />
        {/* Tail */}
        <ellipse cx="50" cy="93" rx="11" ry="6" fill={primary} />
        <ellipse cx="39" cy="95" rx="6" ry="4" fill="#c83010" transform="rotate(-15,39,95)" />
        <ellipse cx="61" cy="95" rx="6" ry="4" fill="#c83010" transform="rotate(15,61,95)" />
        {/* Status overlay */}
        {status === STATES.ERROR && <text x="68" y="20" fontSize="14">❓</text>}
        {status === STATES.DONE && <text x="62" y="22" fontSize="14">✔</text>}
        {status === STATES.TOKEN_EXHAUSTED && <text x="62" y="22" fontSize="14">💸</text>}
        {status === STATES.OFFLINE && <text x="62" y="14" fontSize="12" fill="#94a3b8" className="ml-zzz">z</text>}
      </svg>
    </div>
  );
}

export default function AgentCard({ agent, onRemove, onRename }) {
  const { status, connected, stats, currentTool, errorLog } = useGateway(agent.wsUrl, agent.token);
  const color = STATUS_COLOR[status];

  return (
    <div className="agent-card" style={{ '--status-color': color }}>
      <div className="ac-header">
        <div className="ac-name-row">
          <span
            className="ac-name"
            contentEditable
            suppressContentEditableWarning
            onBlur={e => onRename(agent.id, e.target.textContent.trim() || agent.name)}
          >
            {agent.name}
          </span>
          <span className="ac-dot" />
        </div>
        <button className="ac-remove" onClick={() => onRemove(agent.id)} title="移除">✕</button>
      </div>

      <MiniLobster status={status} />

      <div className="ac-status-badge" style={{ color }}>
        {STATUS_EMOJI[status]} {STATUS_LABEL[status]}
      </div>

      {currentTool && (
        <div className="ac-tool">
          <code>{currentTool.name}</code>
        </div>
      )}

      <div className="ac-stats">
        <div className="ac-stat">
          <span>{fmt(stats.tokensInput + stats.tokensOutput)}</span>
          <small>Tokens</small>
        </div>
        <div className="ac-stat">
          <span>{stats.toolCalls}</span>
          <small>工具</small>
        </div>
        <div className="ac-stat">
          <span>{stats.toolCalls > 0 ? ((stats.toolCallsSuccess / stats.toolCalls) * 100).toFixed(0) + '%' : '—'}</span>
          <small>成功率</small>
        </div>
      </div>

      <div className="ac-url">
        <code>{agent.wsUrl.replace('ws://', '').replace('wss://', '').slice(0, 28)}</code>
      </div>
    </div>
  );
}
