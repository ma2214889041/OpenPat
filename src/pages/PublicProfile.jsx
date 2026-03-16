import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, hasSupabase } from '../utils/supabase';
import { LEVELS, getLevel, ACHIEVEMENTS, RARITY_COLORS } from '../utils/storage';
import LobsterSVG from '../components/LobsterSVG';
import { STATES } from '../hooks/useGateway';
import './PublicProfile.css';

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

const MOCK_PROFILE = {
  username: 'demo_user',
  avatar_url: null,
  total_tasks: 12345,
  total_tool_calls: 4321,
  total_tokens_input: 9800000,
  total_tokens_output: 3200000,
  achievements: ['perfect_task', 'night_owl', 'first_connect', 'tasks_10'],
  level: 2,
};

const MOCK_STATUS = {
  status: 'thinking',
  current_tool: null,
  session_tokens: 45000,
  session_tool_calls: 12,
};

const TITLES = [
  { minTasks: 200000, title: '龙虾神' },
  { minTasks: 50000,  title: '霸王龙虾座' },
  { minTasks: 10000,  title: '深夜代码龙虾' },
  { minTasks: 1000,   title: '勤劳龙虾' },
  { minTasks: 100,    title: '初出茅庐' },
  { minTasks: 0,      title: '虾苗新手' },
];

function getTitle(totalTasks, achievements) {
  if (achievements.includes('night_owl') && totalTasks >= 1000) return '深夜代码龙虾';
  if (achievements.includes('no_error_week')) return '零翻车之王';
  if (achievements.includes('saver')) return 'Token节俭大师';
  return TITLES.find(t => totalTasks >= t.minTasks)?.title || '虾苗新手';
}

const STATUS_COLORS = {
  [STATES.OFFLINE]: '#475569',
  [STATES.IDLE]: '#22c55e',
  [STATES.THINKING]: '#f59e0b',
  [STATES.TOOL_CALL]: '#3b82f6',
  [STATES.DONE]: '#10b981',
  [STATES.ERROR]: '#ef4444',
  [STATES.TOKEN_EXHAUSTED]: '#f97316',
};

const STATUS_TEXT = {
  [STATES.OFFLINE]: '龙虾盖着被子睡觉 zzZ',
  [STATES.IDLE]: '龙虾悠闲待命中',
  [STATES.THINKING]: '龙虾正在思考...',
  [STATES.TOOL_CALL]: '龙虾正在调用工具 ⚡',
  [STATES.DONE]: '龙虾完成任务了！🎉',
  [STATES.ERROR]: '龙虾翻车了 😵',
  [STATES.TOKEN_EXHAUSTED]: '龙虾饿晕了 💸',
};

export default function PublicProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [agentStatus, setAgentStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load profile + realtime subscription
  useEffect(() => {
    if (!hasSupabase) {
      setProfile({ ...MOCK_PROFILE, username: username || 'demo_user' });
      setAgentStatus(MOCK_STATUS);
      setLoading(false);
      return;
    }

    let channel;

    async function loadAll() {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      setProfile(profileData);
      setLoading(false);

      if (!profileData) return;

      const { data: statusData } = await supabase
        .from('agent_status')
        .select('*')
        .eq('user_id', profileData.id)
        .single();

      setAgentStatus(statusData);

      channel = supabase
        .channel(`status:${profileData.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'agent_status',
          filter: `user_id=eq.${profileData.id}`,
        }, (payload) => {
          setAgentStatus(payload.new);
        })
        .subscribe();
    }

    loadAll();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [username]);

  // OG meta tags (must be before early returns — runs when profile loads)
  useEffect(() => {
    if (!profile) return;
    const levelIdx = getLevel(profile.total_tasks);
    const level = LEVELS[levelIdx];
    const achCount = (profile.achievements || []).length;
    const title = `@${profile.username} 的龙虾 — OpenPat`;
    const desc = `${level.name} · ${fmt(profile.total_tasks)} 任务完成 · ${achCount} 个成就`;
    document.title = title;
    const setMeta = (name, content, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel);
      if (!el) {
        el = document.createElement('meta');
        prop ? el.setAttribute('property', name) : el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };
    setMeta('description', desc);
    setMeta('og:title', title, true);
    setMeta('og:description', desc, true);
    setMeta('og:url', `https://openpat.dev/u/${profile.username}`, true);
    setMeta('twitter:card', 'summary');
    setMeta('twitter:title', title);
    setMeta('twitter:description', desc);
    return () => { document.title = 'OpenPat 🦞'; };
  }, [profile]);

  if (loading) {
    return <div className="profile-loading"><span>🦞</span><p>加载中...</p></div>;
  }

  if (!profile) {
    return (
      <div className="profile-notfound">
        <span>🦞</span>
        <h2>找不到这只龙虾</h2>
        <p>@{username} 还没有公开状态页</p>
        <a href="/">养一只你自己的 →</a>
      </div>
    );
  }

  const levelIdx = getLevel(profile.total_tasks);
  const level = LEVELS[levelIdx];
  const status = agentStatus?.status || STATES.OFFLINE;
  const statusColor = STATUS_COLORS[status] || '#94a3b8';
  const statusText = STATUS_TEXT[status] || '';
  const title = getTitle(profile.total_tasks, profile.achievements || []);
  const foundAch = ACHIEVEMENTS.filter(a => (profile.achievements || []).includes(a.id));

  return (
    <div className="profile-page">
      {!hasSupabase && (
        <div className="profile-demo-hint">🎭 演示数据 — 配置 Supabase 后显示真实状态</div>
      )}

      <div className="profile-hero">
        {/* Name + title */}
        <div className="profile-identity">
          <div className="profile-avatar">
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="" />
              : <span>{profile.username[0].toUpperCase()}</span>
            }
          </div>
          <div>
            <h1 className="profile-name">@{profile.username}</h1>
            <div className="profile-title">{title}</div>
          </div>
        </div>

        {/* Big lobster */}
        <div className="profile-lobster-big" style={{ '--glow': statusColor }}>
          <LobsterSVG status={status} fatness={1} onClick={() => {}} />
          <div className="profile-live">
            <span className="live-dot" style={{ background: statusColor }} />
            <span className="live-text">{statusText}</span>
          </div>
        </div>

        {/* 3 core stats */}
        <div className="profile-stats">
          <div className="profile-stat">
            <span className="ps-value">{fmt(profile.total_tasks)}</span>
            <span className="ps-label">任务完成</span>
          </div>
          <div className="profile-stat highlight">
            <span className="ps-value">{level.name}</span>
            <span className="ps-label">当前等级</span>
          </div>
          <div className="profile-stat">
            <span className="ps-value">{foundAch.length}</span>
            <span className="ps-label">成就解锁</span>
          </div>
        </div>

        {/* Achievement badges */}
        {foundAch.length > 0 && (
          <div className="profile-ach-row">
            {foundAch.map(a => {
              const colors = RARITY_COLORS[a.rarity] || RARITY_COLORS.common;
              return (
                <span
                  key={a.id}
                  className="profile-ach-badge"
                  title={`${a.name} — ${a.desc}`}
                  style={{ background: colors.bg, borderColor: colors.border, color: colors.text }}
                >
                  {a.emoji} {a.name}
                </span>
              );
            })}
          </div>
        )}

        <div className="profile-footer">
          <code>npx openpat</code>
          <span className="profile-watermark">openpat.dev</span>
        </div>
      </div>
    </div>
  );
}
