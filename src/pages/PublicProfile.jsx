import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, hasSupabase } from '../utils/supabase';
import { LEVELS, getLevel, ACHIEVEMENTS } from '../utils/storage';
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
  achievements: ['perfect_task', 'night_owl'],
  level: 2,
};

const MOCK_STATUS = {
  status: 'thinking',
  current_tool: null,
  session_tokens: 45000,
  session_tool_calls: 12,
};

export default function PublicProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [agentStatus, setAgentStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabase) {
      setProfile({ ...MOCK_PROFILE, username: username || 'demo_user' });
      setAgentStatus(MOCK_STATUS);
      setLoading(false);
      return;
    }

    let channel;

    async function loadAll() {
      // Load profile first, then use its id for status + realtime
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

      // Realtime subscription keyed on user_id
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
  const foundAch = ACHIEVEMENTS.filter(a => (profile.achievements || []).includes(a.id));

  return (
    <div className="profile-page">
      {!hasSupabase && (
        <div className="profile-demo-hint">🎭 演示数据 — 配置 Supabase 后显示真实状态</div>
      )}

      <div className="profile-card">
        {/* Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="" />
              : <span>{profile.username[0].toUpperCase()}</span>
            }
          </div>
          <div className="profile-meta">
            <h1 className="profile-name">@{profile.username}</h1>
            <div className="profile-level">{level.name} · {fmt(profile.total_tasks)} tasks</div>
          </div>
        </div>

        {/* Lobster + live status */}
        <div className="profile-lobster-section">
          <LobsterSVG status={status} fatness={1} onClick={() => {}} />
          <div className="profile-live">
            <span className={`live-dot live-dot--${status}`} />
            <span className="live-label">实时状态</span>
          </div>
        </div>

        {/* Stats */}
        <div className="profile-stats">
          {[
            ['🔢', fmt(profile.total_tokens_input + profile.total_tokens_output), 'Tokens'],
            ['🛠', fmt(profile.total_tool_calls), '工具调用'],
            ['✅', fmt(profile.total_tasks), '任务完成'],
          ].map(([emoji, val, label]) => (
            <div key={label} className="profile-stat">
              <span className="ps-emoji">{emoji}</span>
              <span className="ps-value">{val}</span>
              <span className="ps-label">{label}</span>
            </div>
          ))}
        </div>

        {/* Achievements */}
        {foundAch.length > 0 && (
          <div className="profile-achievements">
            <h3>成就</h3>
            <div className="profile-ach-grid">
              {foundAch.map(a => (
                <div key={a.id} className="profile-ach" title={a.desc}>
                  <span>{a.emoji}</span>
                  <span>{a.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="profile-footer">
          <code>npx lobster-pet</code> · lobster.pet
        </div>
      </div>
    </div>
  );
}
