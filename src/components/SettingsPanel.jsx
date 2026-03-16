import { useState } from 'react';
import { hasSupabase } from '../utils/supabase';
import './SettingsPanel.css';

export default function SettingsPanel({ onClose }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );

  const handleResetData = () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    ['openpat-data','openpat-connection','openpat-skins',
     'openpat-active-skin','openpat-history','openpat-team']
      .forEach(k => localStorage.removeItem(k));
    window.location.reload();
  };

  const handleNotifToggle = async () => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') {
      const p = await Notification.requestPermission();
      setNotifEnabled(p === 'granted');
    } else {
      alert('请在浏览器设置中关闭此网站的通知权限');
    }
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <div className="sp-header">
          <span>⚙️ 设置</span>
          <button className="sp-close" onClick={onClose}>✕</button>
        </div>

        <div className="sp-section">
          <div className="sp-label">浏览器通知</div>
          <div className="sp-row">
            <span className="sp-desc">
              {notifEnabled ? '✅ 已开启 — 任务完成/报错时通知' : '⭕ 未开启'}
            </span>
            <button className="sp-btn" onClick={handleNotifToggle}>
              {notifEnabled ? '管理权限' : '开启通知'}
            </button>
          </div>
        </div>

        {hasSupabase && (
          <div className="sp-section">
            <div className="sp-label">账号</div>
            <div className="sp-desc">登录后可同步皮肤、公开状态页、排行榜数据</div>
          </div>
        )}

        <div className="sp-section">
          <div className="sp-label">数据</div>
          <div className="sp-row">
            <span className="sp-desc">清空本地等级、成就、会话历史</span>
            <button
              className={`sp-btn ${confirmReset ? 'danger' : ''}`}
              onClick={handleResetData}
            >
              {confirmReset ? '确认清空' : '重置数据'}
            </button>
          </div>
        </div>

        <div className="sp-footer">
          <span>OpenPat v1.0.0</span>
          <a href="https://github.com/openpat/openpat" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
        </div>
      </div>
    </div>
  );
}
