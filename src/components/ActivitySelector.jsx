import { useState } from 'react';
import { IDLE_ANIMATIONS, getUnlockedAnimations } from '../hooks/useActivity';
import './ActivitySelector.css';

export default function ActivitySelector({ selected, currentAnim, totalPomodoros, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  const unlocked = getUnlockedAnimations(totalPomodoros);
  const unlockedIds = new Set(unlocked.map((a) => a.id));
  const currentDef = IDLE_ANIMATIONS.find((a) => a.id === currentAnim) || IDLE_ANIMATIONS[0];

  return (
    <div className="activity-selector">
      {/* Compact bar */}
      <button
        className="activity-bar"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="activity-bar-current">
          <span className="activity-bar-emoji">{currentDef.emoji}</span>
          <span className="activity-bar-name">
            {selected === 'auto' ? `随机 · ${currentDef.name}` : currentDef.name}
          </span>
        </span>
        <span className="activity-bar-count">
          {unlockedIds.size}/{IDLE_ANIMATIONS.length} 已解锁
        </span>
        <span className="activity-bar-toggle">{expanded ? '▲' : '▼'}</span>
      </button>

      {/* Expanded grid */}
      {expanded && (
        <div className="activity-grid">
          {/* Auto mode */}
          <button
            className={`activity-tile ${selected === 'auto' ? 'activity-tile--active' : ''}`}
            onClick={() => { onSelect('auto'); setExpanded(false); }}
          >
            <span className="activity-tile-emoji">🔄</span>
            <span className="activity-tile-name">随机</span>
            <span className="activity-tile-desc">自动切换</span>
          </button>

          {IDLE_ANIMATIONS.map((a) => {
            const isUnlocked = unlockedIds.has(a.id);
            const isActive = selected === a.id;
            return (
              <button
                key={a.id}
                className={`activity-tile ${isActive ? 'activity-tile--active' : ''} ${!isUnlocked ? 'activity-tile--locked' : ''}`}
                onClick={() => {
                  if (isUnlocked) { onSelect(a.id); setExpanded(false); }
                }}
                disabled={!isUnlocked}
                title={isUnlocked ? a.desc : `完成 ${a.unlock} 个番茄钟解锁`}
              >
                <span className="activity-tile-emoji">
                  {isUnlocked ? a.emoji : '🔒'}
                </span>
                <span className="activity-tile-name">{a.name}</span>
                {!isUnlocked ? (
                  <span className="activity-tile-req">{a.unlock}🍅</span>
                ) : (
                  <span className="activity-tile-desc">{a.desc}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
