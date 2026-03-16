import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase, hasSupabase } from '../utils/supabase';
import { LEVELS, getLevel } from '../utils/storage';
import LobsterSVG from '../components/LobsterSVG';
import './Leaderboard.css';

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

const TABS = [
  { id: 'tasks', label: '最勤劳', col: 'total_tasks', emoji: '🔥' },
  { id: 'tokens', label: '最强算力', col: 'total_tokens_input', emoji: '⚡' },
  { id: 'tools', label: '工具王', col: 'total_tool_calls', emoji: '🛠' },
];

const MOCK_DATA = [
  { username: 'molty_dev', avatar_url: null, total_tasks: 142857, total_tokens_input: 89000000, total_tool_calls: 31337, achievements: ['perfect_task','lightning','night_owl'] },
  { username: 'xiaoxia_99', avatar_url: null, total_tasks: 88888, total_tokens_input: 45000000, total_tool_calls: 19999, achievements: ['night_owl','marathon'] },
  { username: 'lobster_god', avatar_url: null, total_tasks: 55555, total_tokens_input: 33000000, total_tool_calls: 14444, achievements: ['perfect_task'] },
  { username: 'openclaw_fan', avatar_url: null, total_tasks: 32100, total_tokens_input: 21000000, total_tool_calls: 9876, achievements: [] },
  { username: 'cyber_shrimp', avatar_url: null, total_tasks: 12345, total_tokens_input: 9800000, total_tool_calls: 4321, achievements: ['saver'] },
];

const ACH_EMOJI = {
  perfect_task:'🎯', lightning:'⚡', saver:'🛡️', night_owl:'🌙',
  marathon:'🔥', no_error_week:'💎', first_connect:'🐣', first_tool:'🔧',
  tasks_10:'✅', tokens_1k:'📊', tasks_100:'💪', skin_changer:'🎨',
  share_5:'📸', tasks_1000:'🏆', big_spender:'💰', resident:'🌍',
  tool_variety:'🔮', lobster_god:'👑', popular:'🌟', skin_collector:'🎭',
};

const TITLES = [
  { minTasks: 200000, title: '龙虾神' },
  { minTasks: 50000, title: '霸王龙虾' },
  { minTasks: 10000, title: '深夜代码龙虾' },
  { minTasks: 1000, title: '勤劳龙虾' },
  { minTasks: 0, title: '虾苗新手' },
];

function getTitle(totalTasks) {
  return TITLES.find(t => totalTasks >= t.minTasks)?.title || '虾苗新手';
}

export default function Leaderboard() {
  const [tab, setTab] = useState('tasks');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const activeTab = TABS.find(t => t.id === tab);

  useEffect(() => {
    if (!hasSupabase) {
      setRows(MOCK_DATA);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('profiles')
      .select('username, avatar_url, total_tasks, total_tokens_input, total_tool_calls, achievements')
      .order(activeTab.col, { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setRows(data || []);
        setLoading(false);
      });
  }, [tab, activeTab]);

  const rankEmoji = (i) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;

  return (
    <div className="leaderboard-page">
      <div className="lb-header">
        <h1>🌐 龙虾广场</h1>
        <p>全球最活跃的赛博龙虾们</p>
        {!hasSupabase && (
          <div className="lb-demo-hint">
            🎭 演示数据 — 配置 Supabase 后显示真实排名
          </div>
        )}
      </div>

      <div className="lb-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`lb-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      <div className="lb-table">
        {loading ? (
          <div className="lb-loading">加载中...</div>
        ) : rows.map((row, i) => {
          const levelIdx = getLevel(row.total_tasks);
          const level = LEVELS[levelIdx];
          const val = tab === 'tasks' ? row.total_tasks
            : tab === 'tokens' ? row.total_tokens_input
            : row.total_tool_calls;
          const title = getTitle(row.total_tasks);
          return (
            <Link key={row.username} to={`/u/${row.username}`} className={`lb-row ${i < 3 ? 'top' : ''}`}>
              <div className="lb-rank">{rankEmoji(i)}</div>
              <div className="lb-avatar">
                {row.avatar_url
                  ? <img src={row.avatar_url} alt="" />
                  : <span>{row.username[0].toUpperCase()}</span>
                }
              </div>
              <div className="lb-lobster-thumb">
                <LobsterSVG status="idle" fatness={1} onClick={() => {}} />
              </div>
              <div className="lb-user">
                <div className="lb-username">@{row.username}</div>
                <div className="lb-level">{level.name} · {title}</div>
              </div>
              <div className="lb-achievements">
                {(row.achievements || []).slice(0, 3).map(id => (
                  <span key={id} className="lb-ach">{ACH_EMOJI[id] || '🏅'}</span>
                ))}
              </div>
              <div className="lb-value">{fmt(val)}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
