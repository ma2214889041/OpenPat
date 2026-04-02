import './PomodoroTimer.css';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const PHASE_LABELS = {
  idle: '准备开始',
  working: '专注中',
  shortBreak: '短休息',
  longBreak: '长休息',
};

const PHASE_EMOJI = {
  idle: '🍅',
  working: '🎯',
  shortBreak: '☕',
  longBreak: '🌿',
};

export default function PomodoroTimer({
  phase, timeLeft, totalSeconds, paused,
  completedPomodoros, onStart, onPause, onResume, onSkip,
}) {
  const progress = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) : 0;
  const circumference = 2 * Math.PI * 54; // r=54
  const dashOffset = circumference * (1 - progress);
  const isActive = phase !== 'idle';

  return (
    <div className={`pomo-timer ${isActive ? 'pomo-timer--active' : ''}`}>
      {/* Circular progress */}
      <div className="pomo-ring-wrap">
        <svg className="pomo-ring" viewBox="0 0 120 120">
          <circle className="pomo-ring-bg" cx="60" cy="60" r="54" />
          {isActive && (
            <circle
              className={`pomo-ring-fill pomo-ring-fill--${phase}`}
              cx="60" cy="60" r="54"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          )}
        </svg>
        <div className="pomo-ring-content">
          {isActive ? (
            <>
              <span className="pomo-time">{formatTime(timeLeft)}</span>
              <span className="pomo-phase-label">{PHASE_LABELS[phase]}</span>
            </>
          ) : (
            <>
              <span className="pomo-emoji">{PHASE_EMOJI.idle}</span>
              <span className="pomo-phase-label">{PHASE_LABELS.idle}</span>
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="pomo-controls">
        {phase === 'idle' && (
          <button className="pomo-btn pomo-btn--start" onClick={onStart}>
            开始专注
          </button>
        )}
        {phase === 'working' && !paused && (
          <button className="pomo-btn pomo-btn--pause" onClick={onPause}>
            暂停
          </button>
        )}
        {phase === 'working' && paused && (
          <button className="pomo-btn pomo-btn--resume" onClick={onResume}>
            继续
          </button>
        )}
        {(phase === 'shortBreak' || phase === 'longBreak') && (
          <button className="pomo-btn pomo-btn--skip" onClick={onSkip}>
            跳过休息
          </button>
        )}
        {phase === 'working' && (
          <button className="pomo-btn pomo-btn--abandon" onClick={onSkip}>
            放弃
          </button>
        )}
      </div>

      {/* Today's tomato count */}
      <div className="pomo-today">
        {Array.from({ length: Math.min(completedPomodoros, 12) }).map((_, i) => (
          <span key={i} className="pomo-tomato">🍅</span>
        ))}
        {completedPomodoros > 12 && (
          <span className="pomo-tomato-more">+{completedPomodoros - 12}</span>
        )}
        {completedPomodoros === 0 && (
          <span className="pomo-today-hint">完成番茄钟后会出现在这里</span>
        )}
      </div>
    </div>
  );
}
