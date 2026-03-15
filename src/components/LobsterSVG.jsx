import { STATES } from '../hooks/useGateway';
import './LobsterSVG.css';

// Colors driven by CSS vars --lp (primary) and --ls (secondary),
// falling back to classic red so the SVG always looks right
const P = 'var(--lp, #e8401c)';
const S = 'var(--ls, #c83010)';
const SD = 'var(--ls-dark, #b02008)';

export default function LobsterSVG({ status, onClick, fatness = 1 }) {
  const cls = `lobster lobster--${status}`;
  const scaleX = 0.9 + fatness * 0.2;

  return (
    <div className={cls} onClick={onClick} title="点击查看详情">
      <svg
        viewBox="0 0 200 220"
        xmlns="http://www.w3.org/2000/svg"
        className="lobster-svg"
        style={{ transform: `scaleX(${scaleX})` }}
      >
        {/* Body */}
        <ellipse cx="100" cy="130" rx="42" ry="52" fill={P} className="body" />

        {/* Head */}
        <ellipse cx="100" cy="80" rx="32" ry="28" fill={P} className="head" />

        {/* Shell segments */}
        <ellipse cx="100" cy="118" rx="38" ry="8" fill={SD} opacity="0.55" />
        <ellipse cx="100" cy="133" rx="36" ry="7" fill={SD} opacity="0.55" />
        <ellipse cx="100" cy="147" rx="33" ry="7" fill={SD} opacity="0.55" />

        {/* Eyes */}
        <g className="eyes">
          <circle cx="84" cy="70" r="9" fill="white" />
          <circle cx="116" cy="70" r="9" fill="white" />
          <circle cx="86" cy="71" r="5" fill="#1a1a2e" className="pupil-left" />
          <circle cx="118" cy="71" r="5" fill="#1a1a2e" className="pupil-right" />
          <circle cx="88" cy="69" r="2" fill="white" />
          <circle cx="120" cy="69" r="2" fill="white" />
        </g>

        {/* Antennae */}
        <g className="antennae">
          <line x1="82" y1="60" x2="55" y2="20" stroke={P} strokeWidth="2.5" strokeLinecap="round" className="antenna-left" />
          <line x1="118" y1="60" x2="145" y2="20" stroke={P} strokeWidth="2.5" strokeLinecap="round" className="antenna-right" />
          <line x1="83" y1="58" x2="65" y2="30" stroke={P} strokeWidth="1.5" strokeLinecap="round" className="feeler-left" />
          <line x1="117" y1="58" x2="135" y2="30" stroke={P} strokeWidth="1.5" strokeLinecap="round" className="feeler-right" />
        </g>

        {/* Claws - LEFT */}
        <g className="claw-left">
          <line x1="65" y1="110" x2="35" y2="95" stroke={P} strokeWidth="10" strokeLinecap="round" />
          <ellipse cx="26" cy="87" rx="12" ry="7" fill={P} transform="rotate(-20,26,87)" />
          <ellipse cx="26" cy="103" rx="12" ry="6" fill={S} transform="rotate(15,26,103)" />
        </g>

        {/* Claws - RIGHT */}
        <g className="claw-right">
          <line x1="135" y1="110" x2="165" y2="95" stroke={P} strokeWidth="10" strokeLinecap="round" />
          <ellipse cx="174" cy="87" rx="12" ry="7" fill={P} transform="rotate(20,174,87)" />
          <ellipse cx="174" cy="103" rx="12" ry="6" fill={S} transform="rotate(-15,174,103)" />
        </g>

        {/* Walking legs */}
        <g className="legs">
          <line x1="70" y1="145" x2="50" y2="172" stroke={P} strokeWidth="3" strokeLinecap="round" className="leg l1" />
          <line x1="72" y1="155" x2="48" y2="180" stroke={P} strokeWidth="3" strokeLinecap="round" className="leg l2" />
          <line x1="130" y1="145" x2="150" y2="172" stroke={P} strokeWidth="3" strokeLinecap="round" className="leg r1" />
          <line x1="128" y1="155" x2="152" y2="180" stroke={P} strokeWidth="3" strokeLinecap="round" className="leg r2" />
        </g>

        {/* Tail fan */}
        <g className="tail">
          <ellipse cx="100" cy="185" rx="22" ry="12" fill={P} />
          <ellipse cx="78" cy="188" rx="12" ry="8" fill={S} transform="rotate(-15,78,188)" />
          <ellipse cx="122" cy="188" rx="12" ry="8" fill={S} transform="rotate(15,122,188)" />
        </g>

        {/* ── Status overlays ── */}
        {status === STATES.THINKING && (
          <g className="thinking-bubbles">
            <circle cx="130" cy="55" r="5" fill="white" opacity="0.9" className="bubble b1" />
            <circle cx="142" cy="42" r="8" fill="white" opacity="0.9" className="bubble b2" />
            <circle cx="158" cy="28" r="12" fill="white" opacity="0.95" className="bubble b3" />
            <text x="158" y="33" textAnchor="middle" fontSize="10" fill="#666">...</text>
          </g>
        )}
        {status === STATES.TOOL_CALL && (
          <g className="tool-sparkles">
            <text x="18" y="88" fontSize="16" className="sparkle s1">⚡</text>
            <text x="158" y="88" fontSize="16" className="sparkle s2">⚡</text>
          </g>
        )}
        {status === STATES.DONE && (
          <g className="done-mark">
            <circle cx="100" cy="45" r="18" fill="#22c55e" className="done-circle" />
            <text x="100" y="52" textAnchor="middle" fontSize="18">✔</text>
          </g>
        )}
        {status === STATES.ERROR && (
          <g className="error-marks">
            <text x="130" y="50" fontSize="20" fill="#ef4444" className="qmark q1">?</text>
            <text x="148" y="35" fontSize="16" fill="#ef4444" className="qmark q2">?</text>
          </g>
        )}
        {status === STATES.TOKEN_EXHAUSTED && (
          <text x="138" y="55" fontSize="22" className="wallet">💸</text>
        )}
        {status === STATES.OFFLINE && (
          <g className="zzz">
            <text x="128" y="52" fontSize="14" fill="#94a3b8" className="z z1">z</text>
            <text x="140" y="38" fontSize="18" fill="#94a3b8" className="z z2">z</text>
            <text x="155" y="24" fontSize="22" fill="#94a3b8" className="z z3">z</text>
          </g>
        )}
      </svg>
    </div>
  );
}
