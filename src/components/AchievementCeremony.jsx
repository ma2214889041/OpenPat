import { useState, useEffect, useRef, useCallback } from 'react';
import './AchievementCeremony.css';

const RARITY_LABELS = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

const PARTICLE_COLORS = [
  '#fbbf24', '#f59e0b', '#60a5fa', '#a78bfa',
  '#34d399', '#f87171', '#fb923c', '#e879f9',
  '#38bdf8', '#4ade80', '#facc15', '#c084fc',
  '#fb7185', '#2dd4bf', '#818cf8', '#fde68a',
  '#bae6fd', '#d9f99d', '#fecaca', '#e9d5ff',
];

function generateParticles(count = 20) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: `${Math.random() * 100}%`,
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    delay: `${(Math.random() * 1.2).toFixed(2)}s`,
    duration: `${(1.5 + Math.random() * 1.5).toFixed(2)}s`,
    size: `${6 + Math.floor(Math.random() * 8)}px`,
  }));
}

const particles = generateParticles(20);

export default function AchievementCeremony({ achievement, onClose }) {
  const [visible, setVisible] = useState(false);
  const closeTimerRef = useRef(null);
  const visibleTimerRef = useRef(null);

  const handleClose = useCallback(() => {
    setVisible(false);
    clearTimeout(closeTimerRef.current);
    clearTimeout(visibleTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      onClose?.();
    }, 400);
  }, [onClose]);

  useEffect(() => {
    // Slight delay before showing for mount transition
    visibleTimerRef.current = setTimeout(() => {
      setVisible(true);
    }, 50);

    // Auto-close after 4000ms
    closeTimerRef.current = setTimeout(() => {
      handleClose();
    }, 4000);

    return () => {
      clearTimeout(visibleTimerRef.current);
      clearTimeout(closeTimerRef.current);
    };
  }, [handleClose]);

  if (!achievement) return null;

  const rarity = achievement.rarity ?? 'common';
  const rarityLabel = (RARITY_LABELS[rarity] ?? '普通') + ' 成就解锁';

  return (
    <div
      className={`ceremony-overlay${visible ? ' visible' : ''}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="成就解锁"
    >
      {/* Particles */}
      <div className="ceremony-particles" aria-hidden="true">
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              '--x': p.x,
              '--color': p.color,
              '--delay': p.delay,
              '--duration': p.duration,
              '--size': p.size,
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div
        className={`ceremony-card ceremony-card--${rarity}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ceremony-shimmer" aria-hidden="true" />

        <div className={`ceremony-rarity ceremony-rarity--${rarity}`}>
          {rarityLabel}
        </div>

        <div className="ceremony-icon">
          {achievement.icon_unlocked ? (
            <img
              src={achievement.icon_unlocked}
              alt={achievement.name}
              className="ceremony-icon-img"
            />
          ) : (
            <span className="ceremony-icon-emoji" role="img" aria-label={achievement.name}>
              {achievement.emoji ?? '🏆'}
            </span>
          )}
        </div>

        <div className="ceremony-name">{achievement.name}</div>
        <div className="ceremony-desc">{achievement.desc}</div>
        <div className="ceremony-hint">点击任意处关闭</div>
      </div>
    </div>
  );
}
