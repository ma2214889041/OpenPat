import './TimeGreeting.css';

export default function TimeGreeting({ petName, greeting, mood, relationshipStage, totalDays }) {
  const moodEmoji = {
    energetic: '☀️',
    normal: '🌤',
    sleepy: '🌙',
    asleep: '💤',
  };

  return (
    <div className={`time-greeting time-greeting--${mood}`}>
      <div className="time-greeting-main">
        <span className="time-greeting-emoji">{moodEmoji[mood] || '☀️'}</span>
        <span className="time-greeting-text">{greeting}</span>
      </div>
      {relationshipStage && (
        <div className="time-greeting-relationship" title={relationshipStage.desc}>
          <span className="tgr-emoji">{relationshipStage.emoji}</span>
          <span className="tgr-name">{relationshipStage.name}</span>
          {totalDays > 0 && <span className="tgr-days">· 第 {totalDays} 天</span>}
        </div>
      )}
    </div>
  );
}
