import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ACHIEVEMENTS, RARITY_COLORS, loadData } from '../utils/storage';
import './Achievements.css';

const RARITY_ORDER = ['legendary', 'epic', 'rare', 'common'];
const RARITY_LABELS = {
  legendary: '传说',
  epic: '史诗',
  rare: '稀有',
  common: '普通',
};

// Achievements that have a numeric progress target
const PROGRESS_MAP = {
  tasks_10:    (d) => ({ cur: d.totalTasks,      max: 10     }),
  tasks_100:   (d) => ({ cur: d.totalTasks,      max: 100    }),
  tasks_1000:  (d) => ({ cur: d.totalTasks,      max: 1000   }),
  pet_legend: (d) => ({ cur: d.totalTasks,      max: 200000 }),
  tokens_1k:   (d) => ({ cur: d.totalTokensInput + d.totalTokensOutput, max: 1000 }),
  share_5:     (d) => ({ cur: d.totalShares || 0, max: 5     }),
  skin_changer:(d) => ({ cur: (d.usedSkinIds || []).length,  max: 3  }),
  skin_collector:(d) => ({ cur: (d.usedSkinIds || []).length, max: 6 }),
  tool_variety:(d) => ({ cur: (d.usedToolNames || []).length, max: 10 }),
  resident:    (d) => ({ cur: (d.activeDays || []).length,    max: 7  }),
};

export default function Achievements() {
  const data = useMemo(() => loadData(), []);
  const unlocked = new Set(data.achievements || []);

  const byRarity = useMemo(() => {
    return RARITY_ORDER.map((rarity) => ({
      rarity,
      items: ACHIEVEMENTS.filter((a) => a.rarity === rarity),
    }));
  }, []);

  const totalUnlocked = unlocked.size;
  const total = ACHIEVEMENTS.length;

  return (
    <div className="ach-page">

      {/* ── Header ── */}
      <div className="ach-page-header">
        <Link to="/app" className="ach-back">← 返回</Link>
        <div className="ach-page-title-wrap">
          <h1 className="ach-page-title">成就</h1>
          <p className="ach-page-sub">记录你们一起走过的每一步</p>
        </div>

        {/* Summary */}
        <div className="ach-summary">
          <div className="ach-summary-progress">
            <div className="ach-summary-bar">
              <div
                className="ach-summary-fill"
                style={{ width: `${Math.round((totalUnlocked / total) * 100)}%` }}
              />
            </div>
            <span className="ach-summary-count">
              {totalUnlocked} / {total}
            </span>
          </div>
          <div className="ach-summary-rarities">
            {RARITY_ORDER.map((r) => {
              const items = ACHIEVEMENTS.filter((a) => a.rarity === r);
              const got = items.filter((a) => unlocked.has(a.id)).length;
              return (
                <div key={r} className={`ach-summary-rarity ach-summary-rarity--${r}`}>
                  <span className="ach-summary-rarity-label">{RARITY_LABELS[r]}</span>
                  <span className="ach-summary-rarity-count">{got}/{items.length}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Sections by rarity ── */}
      <div className="ach-page-body">
        {byRarity.map(({ rarity, items }) => (
          <section key={rarity} className="ach-section">
            <div className={`ach-section-label ach-section-label--${rarity}`}>
              {RARITY_LABELS[rarity]}
            </div>
            <div className="ach-grid">
              {items.map((a) => {
                const isUnlocked = unlocked.has(a.id);
                const progress = PROGRESS_MAP[a.id]?.(data);
                const colors = RARITY_COLORS[a.rarity];

                return (
                  <div
                    key={a.id}
                    className={`ach-card${isUnlocked ? ' ach-card--unlocked' : ' ach-card--locked'}`}
                    style={isUnlocked ? {
                      background: colors.bg,
                      borderColor: colors.border,
                    } : {}}
                  >
                    <div className="ach-card-icon">
                      {isUnlocked
                        ? <span className="ach-card-emoji">{a.emoji}</span>
                        : <span className="ach-card-lock">🔒</span>
                      }
                    </div>
                    <div className="ach-card-info">
                      <div
                        className="ach-card-name"
                        style={isUnlocked ? { color: colors.text } : {}}
                      >
                        {isUnlocked ? a.name : '???'}
                      </div>
                      <div className="ach-card-desc">
                        {isUnlocked ? a.desc : a.desc}
                      </div>
                      {progress && (
                        <div className="ach-card-progress">
                          <div className="ach-card-progress-bar">
                            <div
                              className={`ach-card-progress-fill${isUnlocked ? ' ach-card-progress-fill--done' : ''}`}
                              style={{
                                width: `${Math.min(100, Math.round((progress.cur / progress.max) * 100))}%`,
                                background: isUnlocked ? colors.border : undefined,
                              }}
                            />
                          </div>
                          <span className="ach-card-progress-text">
                            {Math.min(progress.cur, progress.max).toLocaleString()} / {progress.max.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                    {isUnlocked && (
                      <div className={`ach-card-badge ach-card-badge--${rarity}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

    </div>
  );
}
