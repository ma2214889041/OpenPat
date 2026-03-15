import './LevelProgress.css';
import { LEVELS, getLevel } from '../utils/storage';

export default function LevelProgress({ totalTasks }) {
  const idx = getLevel(totalTasks);
  const level = LEVELS[idx];
  const next = LEVELS[idx + 1];

  const progress = next
    ? ((totalTasks - level.min) / (next.min - level.min)) * 100
    : 100;

  const levelEmojis = ['🌱','🦐','🦞','👹','🔱'];

  return (
    <div className="level-progress">
      <div className="level-info">
        <span className="level-icon">{levelEmojis[idx]}</span>
        <div className="level-text">
          <span className="level-name">{level.name}</span>
          {next && (
            <span className="level-next">→ {next.name}</span>
          )}
        </div>
        <span className="level-count">
          {totalTasks.toLocaleString()} tasks
        </span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
      {next && (
        <div className="progress-label">
          还差 {(next.min - totalTasks).toLocaleString()} 个任务升级
        </div>
      )}
    </div>
  );
}
