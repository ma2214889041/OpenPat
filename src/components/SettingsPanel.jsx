import { useState, useEffect } from 'react';
import { hasSupabase, supabase } from '../utils/supabase';
import './SettingsPanel.css';

export default function SettingsPanel({ onClose }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );

  // Auth state
  const [user, setUser] = useState(null);

  // Profile edit state
  const [profileTab,    setProfileTab]    = useState('info'); // 'info' | 'skill'
  const [displayName,   setDisplayName]   = useState('');
  const [avatarUrl,     setAvatarUrl]     = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg,    setProfileMsg]    = useState(null); // { ok, text }

  // Skill token state
  const [apiToken,     setApiToken]     = useState(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [copied,       setCopied]       = useState(false);

  useEffect(() => {
    if (!hasSupabase) return;
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user ?? null;
      setUser(u);
      if (u) loadProfile(u.id);
    });
  }, []);

  async function loadProfile(uid) {
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', uid)
      .single();
    if (data) {
      setDisplayName(data.username ?? '');
      setAvatarUrl(data.avatar_url ?? '');
    }
  }

  async function saveProfile() {
    if (!user) return;
    const name = displayName.trim();
    if (!name) return;
    // Validate: lowercase letters, numbers, underscores, hyphens only
    if (!/^[a-z0-9_-]{1,30}$/.test(name)) {
      setProfileMsg({ ok: false, text: '用户名只能包含小写字母、数字、_ 或 -，最多 30 位' });
      return;
    }
    setProfileSaving(true);
    setProfileMsg(null);
    const { error } = await supabase
      .from('profiles')
      .update({ username: name, avatar_url: avatarUrl.trim() || null })
      .eq('id', user.id);
    setProfileSaving(false);
    if (error) {
      const isDup = error.code === '23505';
      setProfileMsg({ ok: false, text: isDup ? '该用户名已被占用' : '保存失败，请重试' });
    } else {
      setProfileMsg({ ok: true, text: '保存成功 ✓' });
      setTimeout(() => setProfileMsg(null), 2500);
    }
  }

  async function handleGenerateToken() {
    if (!user) return;
    setTokenLoading(true);
    const { data: existing } = await supabase
      .from('api_tokens')
      .select('token')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    if (existing?.token) {
      setApiToken(existing.token);
      setTokenLoading(false);
      return;
    }
    const { data: created, error } = await supabase
      .from('api_tokens')
      .insert({ user_id: user.id, label: 'OpenPat' })
      .select('token')
      .single();
    if (!error && created?.token) setApiToken(created.token);
    setTokenLoading(false);
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
  const configJson = apiToken
    ? JSON.stringify({ endpoint: `${supabaseUrl}/functions/v1/event`, token: apiToken }, null, 2)
    : null;

  function handleCopy() {
    if (!configJson) return;
    navigator.clipboard.writeText(configJson).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

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

        {/* ── Notifications ── */}
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

        {/* ── Profile + Skill (when logged in) ── */}
        {hasSupabase && user && (
          <div className="sp-section">
            <div className="sp-label">账号</div>

            {/* Tab switcher */}
            <div className="sp-tabs">
              <button
                className={`sp-tab${profileTab === 'info' ? ' sp-tab--active' : ''}`}
                onClick={() => setProfileTab('info')}
              >
                个人信息
              </button>
              <button
                className={`sp-tab${profileTab === 'skill' ? ' sp-tab--active' : ''}`}
                onClick={() => setProfileTab('skill')}
              >
                Agent Skill
              </button>
            </div>

            {profileTab === 'info' && (
              <div className="sp-profile-form">
                {/* Avatar preview */}
                <div className="sp-avatar-row">
                  <div className="sp-avatar">
                    {avatarUrl
                      ? <img src={avatarUrl} alt="" />
                      : <span>{(displayName || user.email || '?')[0].toUpperCase()}</span>
                    }
                  </div>
                  <div className="sp-avatar-info">
                    <div className="sp-avatar-name">@{displayName || '…'}</div>
                    <div className="sp-avatar-email">{user.email}</div>
                  </div>
                </div>

                <label className="sp-field">
                  <span className="sp-field-label">用户名</span>
                  <input
                    className="sp-input"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value.toLowerCase())}
                    placeholder="只能小写字母 / 数字 / _"
                    maxLength={30}
                    spellCheck={false}
                  />
                </label>

                <label className="sp-field">
                  <span className="sp-field-label">头像 URL（可选）</span>
                  <input
                    className="sp-input"
                    value={avatarUrl}
                    onChange={e => setAvatarUrl(e.target.value)}
                    placeholder="https://…"
                    spellCheck={false}
                  />
                </label>

                {profileMsg && (
                  <div className={`sp-msg ${profileMsg.ok ? 'sp-msg--ok' : 'sp-msg--err'}`}>
                    {profileMsg.text}
                  </div>
                )}

                <button
                  className="sp-btn sp-btn--full sp-btn--primary"
                  onClick={saveProfile}
                  disabled={profileSaving}
                >
                  {profileSaving ? '保存中…' : '保存'}
                </button>
              </div>
            )}

            {profileTab === 'skill' && (
              <div className="sp-skill-body">
                <div className="sp-desc">
                  让 Agent 在后台推送 Agent 状态，即使没有浏览器标签也能同步
                </div>
                {!apiToken ? (
                  <button
                    className="sp-btn sp-btn--full"
                    onClick={handleGenerateToken}
                    disabled={tokenLoading}
                  >
                    {tokenLoading ? '生成中…' : '生成 Token'}
                  </button>
                ) : (
                  <>
                    <div className="sp-skill-json">
                      <pre>{configJson}</pre>
                    </div>
                    <button className="sp-btn sp-btn--full" onClick={handleCopy}>
                      {copied ? '✅ 已复制' : '复制 JSON'}
                    </button>
                    <div className="sp-desc sp-desc--mono">
                      保存到 <code>~/.openpat/openpat.json</code>
                    </div>
                  </>
                )}
                <details className="sp-skill-help">
                  <summary>如何安装 Skill？</summary>
                  <div className="sp-skill-steps">
                    <p>把项目里的 <code>skill/SKILL.md</code> 复制到你的 Agent skills 目录，然后保存上方 JSON 即可。</p>
                    <p>安装后在 Agent 里运行 <code>/openpat status</code> 确认连接。</p>
                  </div>
                </details>
              </div>
            )}
          </div>
        )}

        {hasSupabase && !user && (
          <div className="sp-section">
            <div className="sp-label">账号</div>
            <div className="sp-desc">登录后可同步皮肤、公开状态页、排行榜数据</div>
          </div>
        )}

        {/* ── Data reset ── */}
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
          <a href="https://github.com/ma2214889041/OpenPat" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
        </div>
      </div>
    </div>
  );
}
