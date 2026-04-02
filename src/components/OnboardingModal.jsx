import { useState } from 'react';
import './OnboardingModal.css';

export default function OnboardingModal({ defaultName, onComplete }) {
  const [name, setName] = useState(defaultName || '小龙');

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete(name.trim() || '小龙');
  };

  return (
    <div className="onboard-overlay">
      <div className="onboard-card">
        <div className="onboard-emoji">🐾</div>
        <h2 className="onboard-title">欢迎来到 OpenPat</h2>
        <p className="onboard-desc">
          给你的办公伴侣起个名字吧！<br />
          它会陪你一起专注工作、完成任务
        </p>
        <form className="onboard-form" onSubmit={handleSubmit}>
          <input
            className="onboard-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="小龙"
            maxLength={20}
            autoFocus
          />
          <button className="onboard-btn" type="submit">
            开始吧！
          </button>
        </form>
        <p className="onboard-hint">
          你可以随时在设置中修改名字
        </p>
      </div>
    </div>
  );
}
