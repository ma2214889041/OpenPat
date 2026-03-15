import { useState } from 'react';
import { clearHistory } from '../utils/sessionHistory';
import { hasSupabase } from '../utils/supabase';
import './SettingsPanel.css';

export default function SettingsPanel({ onClose, onResetData }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [lang, setLang] = useState(localStorage.getItem('lp-lang') || 'zh');
  const [notifEnabled, setNotifEnabled] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );

  const handleLang = (v) => {
    setLang(v);
    localStorage.setItem('lp-lang', v);
    // Full reload to apply (simple i18n)
    window.location.reload();
  };

  const handleResetData = () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    // Clear everything
    ['lobster-pet-data','lobster-pet-connection','lobster-pet-skins',
     'lobster-pet-active-skin','lobster-pet-history','lobster-pet-team']
      .forEach(k => localStorage.removeItem(k));
    clearHistory();
    onResetData?.();
    window.location.reload();
  };

  const handleNotifToggle = async () => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') {
      const p = await Notification.requestPermission();
      setNotifEnabled(p === 'granted');
    } else {
      // Can't programmatically revoke — point user to browser settings
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
          <div className="sp-label">语言 / Language</div>
          <div className="sp-toggle-group">
            <button className={`sp-toggle ${lang === 'zh' ? 'active' : ''}`} onClick={() => handleLang('zh')}>
              🇨🇳 中文
            </button>
            <button className={`sp-toggle ${lang === 'en' ? 'active' : ''}`} onClick={() => handleLang('en')}>
              🇺🇸 English
            </button>
          </div>
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

        <div className="sp-section">
          <div className="sp-label">快捷键</div>
          <div className="sp-keys">
            {[
              ['S','生成分享卡片'],['H','历史会话'],['C','复制摘要'],
              ['M','模型显示'],['N','开启通知'],['?','快捷键列表']
            ].map(([k,d]) => (
              <div key={k} className="sp-key-row">
                <kbd>{k}</kbd>
                <span>{d}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="sp-footer">
          <span>Lobster Pet v1.0.0</span>
          <a href="https://github.com/lobster-pet/lobster-pet" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
        </div>
      </div>
    </div>
  );
}
