import { STATES } from '../hooks/useGateway';
import './LobsterSVG.css';

// Colors driven by CSS vars --lp (primary) and --ls (secondary),
// falling back to classic red so the SVG always looks right
const P = 'var(--lp, #e8401c)';
const S = 'var(--ls, #c83010)';
const SD = 'var(--ls-dark, #b02008)';

export default function LobsterSVG({ status, onClick, fatness = 1, skin = 'default', rank = 'bronze', accessory = 'none' }) {
  const cls = `lobster lobster--${status} lobster--skin-${skin} lobster--rank-${rank} lobster--acc-${accessory}`;
  const scaleX = 0.9 + fatness * 0.2;

  // Colors are primarily driven by CSS vars passed from the wrapper
  // --lp (primary), --ls (secondary), --ls-dark (secondary dark)
  // These are re-declared here to ensure they are scoped to the component render
  // and can be used directly in SVG fill/stroke attributes.
  const P = 'var(--lp, #e8401c)';
  const S = 'var(--ls, #c83010)';
  const SD = 'var(--ls-dark, #b02008)';

  return (
    <div className={cls} onClick={onClick} title="点击查看详情">
      <svg
        viewBox="0 0 200 240"
        xmlns="http://www.w3.org/2000/svg"
        className="lobster-svg"
        style={{ transform: `scaleX(${scaleX})` }}
      >
        <defs>
          {/* Main Body Gradient */}
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={P} />
            <stop offset="100%" stopColor={S} />
          </linearGradient>

          {/* Shell Highlight Gradient */}
          <radialGradient id="shellHighlight" cx="50%" cy="30%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0.4" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>

          {/* Deep Shadow Gradient */}
          <linearGradient id="deepShadow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="black" stopOpacity="0.3" />
            <stop offset="100%" stopColor="black" stopOpacity="0" />
          </linearGradient>

          {/* Glossy Overlay */}
          <linearGradient id="glossOverlay" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.3" />
            <stop offset="50%" stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="white" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Shadow under the lobster */}
        <ellipse cx="100" cy="200" rx="45" ry="10" fill="rgba(0,0,0,0.15)" className="lobster-ground-shadow" />

        {/* Body */}
        <ellipse cx="100" cy="130" rx="42" ry="52" fill="url(#bodyGradient)" className="body" />
        <ellipse cx="100" cy="130" rx="42" ry="52" fill="url(#glossOverlay)" className="body-gloss" pointerEvents="none" />

        {/* Head */}
        <ellipse cx="100" cy="80" rx="32" ry="28" fill="url(#bodyGradient)" className="head" />
        <ellipse cx="100" cy="70" rx="20" ry="10" fill="url(#shellHighlight)" pointerEvents="none" />

        {/* Shell segments */}
        <g className="shell-segments">
          <ellipse cx="100" cy="118" rx="38" ry="8" fill={SD} opacity="0.6" />
          <ellipse cx="100" cy="133" rx="36" ry="7" fill={SD} opacity="0.6" />
          <ellipse cx="100" cy="147" rx="33" ry="7" fill={SD} opacity="0.6" />
        </g>

        {/* Eyes */}
        <g className="eyes">
          <circle cx="84" cy="70" r="10" fill="white" stroke={SD} strokeWidth="1" />
          <circle cx="116" cy="70" r="10" fill="white" stroke={SD} strokeWidth="1" />
          <circle cx="86" cy="71" r="5.5" fill="#1a1a2e" className="pupil-left" />
          <circle cx="118" cy="71" r="5.5" fill="#1a1a2e" className="pupil-right" />
          {/* Eye shines */}
          <circle cx="83" cy="68" r="2.5" fill="white" />
          <circle cx="115" cy="68" r="2.5" fill="white" />
        </g>

        {/* Antennae */}
        <g className="antennae">
          <path d="M 82 60 Q 70 40 55 20" fill="none" stroke={P} strokeWidth="3" strokeLinecap="round" className="antenna-left" />
          <path d="M 118 60 Q 130 40 145 20" fill="none" stroke={P} strokeWidth="3" strokeLinecap="round" className="antenna-right" />
        </g>

        {/* Claws - LEFT */}
        <g className="claw-left">
          <path d="M 65 110 L 35 95" stroke={P} strokeWidth="12" strokeLinecap="round" />
          <ellipse cx="26" cy="87" rx="14" ry="9" fill="url(#bodyGradient)" transform="rotate(-20,26,87)" />
          <ellipse cx="26" cy="103" rx="14" ry="8" fill={S} transform="rotate(15,26,103)" />
          <path d="M 20 85 Q 26 80 32 85" fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="2" transform="rotate(-20,26,87)" />
        </g>

        {/* Claws - RIGHT */}
        <g className="claw-right">
          <path d="M 135 110 L 165 95" stroke={P} strokeWidth="12" strokeLinecap="round" />
          <ellipse cx="174" cy="87" rx="14" ry="9" fill="url(#bodyGradient)" transform="rotate(20,174,87)" />
          <ellipse cx="174" cy="103" rx="14" ry="8" fill={S} transform="rotate(-15,174,103)" />
          <path d="M 168 85 Q 174 80 180 85" fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="2" transform="rotate(20,174,87)" />
        </g>

        {/* Walking legs */}
        <g className="legs">
          <path d="M 70 145 Q 60 160 50 172" fill="none" stroke={P} strokeWidth="4" strokeLinecap="round" className="leg l1" />
          <path d="M 72 155 Q 60 170 48 180" fill="none" stroke={P} strokeWidth="4" strokeLinecap="round" className="leg l2" />
          <path d="M 130 145 Q 140 160 150 172" fill="none" stroke={P} strokeWidth="4" strokeLinecap="round" className="leg r1" />
          <path d="M 128 155 Q 140 170 152 180" fill="none" stroke={P} strokeWidth="4" strokeLinecap="round" className="leg r2" />
        </g>

        {/* Tail fan */}
        <g className="tail">
          <path d="M 80 180 Q 100 200 120 180" fill={P} />
          <ellipse cx="100" cy="185" rx="25" ry="14" fill="url(#bodyGradient)" />
          <ellipse cx="75" cy="188" rx="15" ry="10" fill={S} transform="rotate(-15,75,188)" />
          <ellipse cx="125" cy="188" rx="15" ry="10" fill={S} transform="rotate(15,125,188)" />
        </g>

        {/* ── Accessories ── */}
        {accessory === 'party_hat' && (
          <g className="acc acc-party-hat">
            <path d="M 83 56 L 100 16 L 117 56 Z" fill="#ff6b9d" stroke="#e91e8c" strokeWidth="1" />
            <path d="M 87 52 L 102 22" stroke="white" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
            <path d="M 95 55 L 109 32" stroke="white" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
            <ellipse cx="100" cy="56" rx="17" ry="4" fill="#e91e8c" opacity="0.7" />
            <circle cx="100" cy="15" r="5" fill="#ffd700" />
          </g>
        )}
        {accessory === 'graduation' && (
          <g className="acc acc-graduation">
            <rect x="72" y="44" width="56" height="6" rx="1" fill="#1a1a2e" />
            <rect x="86" y="50" width="28" height="7" rx="2" fill="#1a1a2e" />
            <line x1="128" y1="47" x2="130" y2="62" stroke="#ffd700" strokeWidth="1.5" />
            <circle cx="130" cy="65" r="3.5" fill="#ffd700" />
          </g>
        )}
        {accessory === 'sunglasses' && (
          <g className="acc acc-sunglasses">
            <ellipse cx="84" cy="70" rx="13" ry="8" fill="rgba(0,0,0,0.78)" stroke="#222" strokeWidth="1.5" />
            <ellipse cx="116" cy="70" rx="13" ry="8" fill="rgba(0,0,0,0.78)" stroke="#222" strokeWidth="1.5" />
            <line x1="97" y1="70" x2="103" y2="70" stroke="#444" strokeWidth="2" />
            <line x1="71" y1="70" x2="63" y2="68" stroke="#333" strokeWidth="2" strokeLinecap="round" />
            <line x1="129" y1="70" x2="137" y2="68" stroke="#333" strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="79" cy="67" rx="4" ry="2.5" fill="white" opacity="0.2" />
            <ellipse cx="111" cy="67" rx="4" ry="2.5" fill="white" opacity="0.2" />
          </g>
        )}
        {accessory === 'top_hat' && (
          <g className="acc acc-top-hat">
            <rect x="80" y="28" width="40" height="26" rx="3" fill="#1a1a1a" />
            <rect x="68" y="52" width="64" height="6" rx="3" fill="#111" />
            <rect x="80" y="50" width="40" height="5" rx="0" fill="#8b0000" />
            <rect x="84" y="30" width="32" height="4" rx="1" fill="rgba(255,255,255,0.05)" />
          </g>
        )}
        {accessory === 'chef_hat' && (
          <g className="acc acc-chef-hat">
            <ellipse cx="100" cy="44" rx="22" ry="18" fill="white" stroke="#e5e5e5" strokeWidth="1" />
            <rect x="78" y="52" width="44" height="8" rx="2" fill="#f0f0f0" stroke="#ddd" strokeWidth="1" />
            <path d="M 82 46 Q 88 39 94 46" fill="none" stroke="#ddd" strokeWidth="1.2" />
            <path d="M 106 46 Q 112 39 118 46" fill="none" stroke="#ddd" strokeWidth="1.2" />
          </g>
        )}
        {accessory === 'halo' && (
          <g className="acc acc-halo">
            <ellipse cx="100" cy="40" rx="30" ry="7" fill="rgba(255,215,0,0.12)" stroke="#ffd700" strokeWidth="2.5" className="halo-ring" />
            <ellipse cx="100" cy="40" rx="30" ry="7" fill="none" stroke="rgba(255,215,0,0.4)" strokeWidth="5" className="halo-glow" />
          </g>
        )}
        {accessory === 'crown' && (
          <g className="acc acc-crown-acc">
            <path d="M 78 56 L 74 38 L 89 49 L 100 32 L 111 49 L 126 38 L 122 56 Z" fill="#ffd700" stroke="#b8860b" strokeWidth="1.5" />
            <rect x="78" y="53" width="44" height="5" rx="1" fill="#e6b800" />
            <circle cx="74" cy="38" r="3.5" fill="#ff4444" />
            <circle cx="100" cy="32" r="3.5" fill="#4488ff" />
            <circle cx="126" cy="38" r="3.5" fill="#44ff88" />
            <ellipse cx="91" cy="46" rx="6" ry="3" fill="white" opacity="0.2" transform="rotate(-15,91,46)" />
          </g>
        )}
        {accessory === 'cyber_visor' && (
          <g className="acc acc-cyber-visor">
            <rect x="67" y="62" width="66" height="18" rx="4" fill="rgba(0,242,255,0.18)" stroke="#00f2ff" strokeWidth="1.5" className="visor-frame" />
            <line x1="67" y1="71" x2="133" y2="71" stroke="rgba(0,242,255,0.35)" strokeWidth="0.5" className="visor-scan" />
            <rect x="67" y="62" width="66" height="18" rx="4" fill="none" stroke="rgba(0,242,255,0.25)" strokeWidth="4" />
            <line x1="75" y1="64" x2="75" y2="78" stroke="rgba(0,242,255,0.45)" strokeWidth="0.5" />
            <line x1="125" y1="64" x2="125" y2="78" stroke="rgba(0,242,255,0.45)" strokeWidth="0.5" />
            <rect x="96" y="66" width="8" height="8" rx="1" fill="none" stroke="rgba(0,242,255,0.55)" strokeWidth="0.5" />
          </g>
        )}

        {/* Rank Visuals: Crown for high ranks */}
        {rank === 'gold' && (
          <g className="rank-ornament rank-crown">
            <path d="M 85 55 L 80 40 L 90 48 L 100 35 L 110 48 L 120 40 L 115 55 Z" fill="#ffd700" stroke="#b8860b" strokeWidth="1" />
            <circle cx="80" cy="40" r="2" fill="#ff4444" />
            <circle cx="100" cy="35" r="2" fill="#4444ff" />
            <circle cx="120" cy="40" r="2" fill="#44ff44" />
          </g>
        )}
        {rank === 'cyber' && (
          <g className="rank-ornament rank-visors">
            <rect x="75" y="65" width="50" height="8" rx="2" fill="rgba(0,242,255,0.4)" stroke="#00f2ff" />
            <line x1="75" y1="69" x2="125" y2="69" stroke="white" strokeWidth="0.5" opacity="0.5" />
          </g>
        )}

        {/* ── Status overlays ── */}
        {status === STATES.THINKING && (
          <g className="thinking-bubbles">
            <circle cx="130" cy="55" r="5" fill="white" opacity="0.9" className="bubble b1" />
            <circle cx="142" cy="42" r="8" fill="white" opacity="0.9" className="bubble b2" />
            <circle cx="158" cy="28" r="14" fill="white" opacity="0.95" className="bubble b3" />
            <text x="158" y="33" textAnchor="middle" fontSize="12" fill="#666" fontWeight="bold">...</text>
          </g>
        )}
        {status === STATES.TOOL_CALL && (
          <g className="tool-sparkles">
            <text x="15" y="80" fontSize="20" className="sparkle s1">⚡</text>
            <text x="165" y="80" fontSize="20" className="sparkle s2">⚡</text>
          </g>
        )}
        {status === STATES.DONE && (
          <g className="done-mark">
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <circle cx="100" cy="45" r="20" fill="#22c55e" filter="url(#glow)" className="done-circle" />
            <text x="100" y="52" textAnchor="middle" fontSize="20" fill="white">✔</text>
          </g>
        )}
        {status === STATES.ERROR && (
          <g className="error-marks">
            <text x="135" y="45" fontSize="28" fill="#ef4444" fontWeight="bold" className="qmark q1">?</text>
            <text x="155" y="30" fontSize="22" fill="#ef4444" fontWeight="bold" className="qmark q2">?</text>
          </g>
        )}
        {status === STATES.TOKEN_EXHAUSTED && (
          <text x="140" y="50" fontSize="28" className="wallet">💸</text>
        )}
        {status === STATES.OFFLINE && (
          <g className="zzz">
            <text x="130" y="50" fontSize="16" fill="#94a3b8" fontWeight="bold" className="z z1">Z</text>
            <text x="145" y="35" fontSize="22" fill="#94a3b8" fontWeight="bold" className="z z2">Z</text>
            <text x="165" y="20" fontSize="28" fill="#94a3b8" fontWeight="bold" className="z z3">Z</text>
          </g>
        )}
      </svg>
    </div>
  );
}
