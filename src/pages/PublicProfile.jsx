import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, hasSupabase } from '../utils/supabase';
import { LEVELS, getLevel, ACHIEVEMENTS, RARITY_COLORS } from '../utils/storage';
import LobsterSVG from '../components/LobsterSVG';
import AnimatedPet from '../components/AnimatedPet';
import { loadAllSkins, prepareSkinForDisplay } from '../utils/skinStorage';
import { STATES } from '../hooks/useGateway';
import { loadAllMemesFromCloud } from '../utils/supabaseStorage';
import { generateMemeShareCard } from '../utils/shareCard';
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
  { minTasks: 200000, title: '传奇大师' },
  { minTasks: 50000,  title: '顶尖高手' },
  { minTasks: 10000,  title: '夜间程序员' },
  { minTasks: 1000,   title: '勤奋者' },
  { minTasks: 100,    title: '初出茅庐' },
  { minTasks: 0,      title: '新手上路' },
];

function getTitle(totalTasks, achievements) {
  if (achievements.includes('night_owl') && totalTasks >= 1000) return '夜间程序员';
  if (achievements.includes('no_error_week')) return '零翻车之王';
  if (achievements.includes('saver')) return 'Token 节省王';
  return TITLES.find(t => totalTasks >= t.minTasks)?.title ?? '新手上路';
}

const STATUS_COLORS = {
  [STATES.OFFLINE]:         '#aaaaaa',
  [STATES.IDLE]:            '#22c55e',
  [STATES.THINKING]:        '#f59e0b',
  [STATES.TOOL_CALL]:       '#8B8BFF',
  [STATES.DONE]:            '#83FFC1',
  [STATES.ERROR]:           '#ef4444',
  [STATES.TOKEN_EXHAUSTED]: '#f97316',
};

const STATUS_TEXT = {
  [STATES.OFFLINE]:         '离线中',
  [STATES.IDLE]:            '待命中',
  [STATES.THINKING]:        '思考中...',
  [STATES.TOOL_CALL]:       '调用工具中 ⚡',
  [STATES.DONE]:            '任务完成 ✓',
  [STATES.ERROR]:           '发生错误',
  [STATES.TOKEN_EXHAUSTED]: 'Token 耗尽',
};

// ── 段子生成器 ───────────────────────────────────────────────────────────────
function generateDuanzi(profile, agentStatus) {
  const lines = [];
  const tasks      = profile.total_tasks || 0;
  const tokens     = (profile.total_tokens_input || 0) + (profile.total_tokens_output || 0);
  const toolCalls  = profile.total_tool_calls || 0;
  const achs       = profile.achievements || [];
  const status     = agentStatus?.status || STATES.OFFLINE;
  const sessionTok = agentStatus?.session_tokens || 0;

  // 任务数量行（必有）
  if (tasks > 10000) {
    lines.push(`完成了 ${fmt(tasks)} 个任务。AI 这辈子的工作量，被你一个人包揽了。`);
  } else if (tasks >= 1000) {
    lines.push(`${fmt(tasks)} 个任务完成，已经超越了 99% 的使用者。剩下那 1% 可能还在写 README。`);
  } else if (tasks >= 100) {
    lines.push(`${fmt(tasks)} 个任务，入门了。但传说还早，继续肝。`);
  } else {
    lines.push(`才 ${fmt(tasks)} 个任务，正在成为传说的路上 —— 路还很长。`);
  }

  // 成就 / 消耗行
  if (achs.includes('night_owl')) {
    lines.push('凌晨还在肝。妈妈知道吗？');
  } else if (achs.includes('no_error_week')) {
    lines.push('一整周零翻车。这已经不是能力问题，是玄学。');
  } else if (tokens > 5_000_000) {
    lines.push(`烧掉了 ${fmt(tokens)} 个 Token，按字数算相当于写了 ${Math.round(tokens / 500)} 篇论文，结果啥都没发表。`);
  } else if (toolCalls > 1000) {
    lines.push(`工具调用了 ${fmt(toolCalls)} 次，比你今年换过的心情还多。`);
  } else if (achs.includes('perfect_task')) {
    lines.push('完美任务达成。AI 此刻应该感谢你没有给它出难题。');
  }

  // 当前状态行
  if (status === STATES.THINKING) {
    lines.push('当前正在思考。请勿打扰，它需要安静。');
  } else if (status === STATES.TOOL_CALL) {
    lines.push('正在调用工具。这活儿你不想自己做，它替你扛着。');
  } else if (status === STATES.IDLE) {
    lines.push('现在空闲中，像极了等消息却不敢先发的你。');
  } else if (status === STATES.DONE) {
    lines.push('刚刚完成了任务，正在得意地抖着。');
  } else if (status === STATES.ERROR) {
    lines.push('刚才翻车了。没关系，失败是成功他妈。');
  } else if (sessionTok > 30000) {
    lines.push(`这一局就烧了 ${fmt(sessionTok)} Token，希望结果值得。`);
  }

  return lines.slice(0, 3);
}

// ── 段子组件 ─────────────────────────────────────────────────────────────────
function ProfileDuanzi({ lines }) {
  if (!lines?.length) return null;
  return (
    <div className="profile-duanzi">
      <div className="duanzi-header">AI 说你的故事</div>
      {lines.map((line, i) => (
        <div key={i} className="duanzi-line">{line}</div>
      ))}
    </div>
  );
}

// ── 主组件 ───────────────────────────────────────────────────────────────────
export default function PublicProfile() {
  const { username } = useParams();
  const [profile, setProfile]         = useState(null);
  const [agentStatus, setAgentStatus] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [activeSkin, setActiveSkin]   = useState(null);
  const [cloudMemes, setCloudMemes]   = useState({});
  const [sharing, setSharing]         = useState(false);

  // Load cloud memes for share button
  useEffect(() => {
    loadAllMemesFromCloud().then(setCloudMemes).catch(() => {});
  }, []);

  // Load first available animated skin from IndexedDB
  useEffect(() => {
    loadAllSkins()
      .then(async (skins) => {
        const active = skins.filter(s => s.is_active);
        if (active.length > 0) {
          const prepared = await prepareSkinForDisplay(active[0]);
          setActiveSkin(prepared);
        }
      })
      .catch(() => {});
  }, []);

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
        }, (payload) => setAgentStatus(payload.new))
        .subscribe();
    }

    loadAll();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [username]);

  // OG meta tags
  useEffect(() => {
    if (!profile) return;
    const levelIdx = getLevel(profile.total_tasks);
    const level    = LEVELS[levelIdx];
    const achCount = (profile.achievements || []).length;
    const title    = `@${profile.username} — OpenPat`;
    const desc     = `${level.name} · ${fmt(profile.total_tasks)} 任务完成 · ${achCount} 个成就`;
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
    return () => { document.title = 'OpenPat'; };
  }, [profile]);

  // ── Meme share for this profile's current state ──
  const handleMemeShare = useCallback(async () => {
    if (!profile || sharing) return;
    setSharing(true);
    const stateKey = agentStatus?.status || STATES.OFFLINE;
    const meme = cloudMemes[stateKey] ?? cloudMemes['idle'] ?? null;
    const DEFAULT_CAPTIONS = {
      idle: '摸鱼中。不打扰它。',
      thinking: '它在思考，就像你不会的那些事。',
      tool_call: '正在调用工具。这活儿你不想自己做，它替你扛着。',
      done: '搞定了。下一个。',
      error: '翻车了，但还在爬。',
      offline: '它在休息。等等它。',
      token_exhausted: '没 Token 了。账单来了吗？',
    };
    const caption = meme?.caption || DEFAULT_CAPTIONS[stateKey] || '我的 Agent 正在工作';
    try {
      const dataUrl = await generateMemeShareCard({
        memeImageUrl: meme?.image_url ?? null,
        caption,
        username: profile.username,
        profileUrl: `openp.at/u/${profile.username}`,
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `openpat-${profile.username}-${stateKey}.png`;
      a.click();
    } catch (err) {
      console.error('梗图分享失败:', err);
    } finally {
      setSharing(false);
    }
  }, [profile, agentStatus, cloudMemes, sharing]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="profile-loading">
        <div className="profile-spinner" />
        <p>加载中...</p>
      </div>
    );
  }

  // ── Not found ──
  if (!profile) {
    return (
      <div className="profile-notfound">
        <h2>找不到这个用户</h2>
        <p>@{username} 还没有公开状态页</p>
        <Link to="/">开始你的旅程 →</Link>
      </div>
    );
  }

  const levelIdx   = getLevel(profile.total_tasks);
  const level      = LEVELS[levelIdx];
  const status     = agentStatus?.status || STATES.OFFLINE;
  const statusColor = STATUS_COLORS[status] || '#aaa';
  const statusText  = STATUS_TEXT[status] || '离线中';
  const title       = getTitle(profile.total_tasks, profile.achievements || []);
  const foundAch    = ACHIEVEMENTS.filter(a => (profile.achievements || []).includes(a.id));
  const duanziLines = generateDuanzi(profile, agentStatus);

  return (
    <div className="profile-page">
      {!hasSupabase && (
        <div className="profile-demo-hint">演示数据 — 配置 Supabase 后显示真实状态</div>
      )}

      <div className="profile-card">

        {/* ── Identity row ── */}
        <div className="profile-identity">
          <div className="profile-avatar">
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="" />
              : <span>{profile.username[0].toUpperCase()}</span>
            }
          </div>
          <div className="profile-info">
            <h1 className="profile-name">@{profile.username}</h1>
            <div className="profile-badge">{title}</div>
          </div>
          <div className="profile-live-pill">
            <span className="live-dot" style={{ background: statusColor }} />
            <span className="live-text">{statusText}</span>
          </div>
        </div>

        {/* ── Pet stage ── */}
        <div className="profile-pet-stage" style={{ '--glow': statusColor }}>
          {activeSkin ? (
            <AnimatedPet
              skin={activeSkin}
              status={status}
              isHappy={false}
              onClick={() => {}}
            />
          ) : (
            <LobsterSVG status={status} fatness={1} onClick={() => {}} />
          )}
        </div>

        {/* ── Stats ── */}
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

        {/* ── Achievements ── */}
        {foundAch.length > 0 && (
          <div className="profile-ach-row">
            {foundAch.map(a => {
              const colors = RARITY_COLORS[a.rarity] ?? RARITY_COLORS.common;
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

        {/* ── Share ── */}
        <button
          className="profile-share-btn"
          onClick={handleMemeShare}
          disabled={sharing}
        >
          {sharing ? '生成中...' : '😂 分享状态梗图'}
        </button>

        {/* ── Footer ── */}
        <div className="profile-footer">
          <code>npx openpat</code>
          <span className="profile-watermark">openpat.dev</span>
        </div>
      </div>

      <ProfileDuanzi lines={duanziLines} />
    </div>
  );
}
