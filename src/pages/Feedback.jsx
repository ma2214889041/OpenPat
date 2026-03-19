import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase, hasSupabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import './Feedback.css';

const MOCK_ITEMS = [
  { id: '1', title: '皮肤 & 形象系统', description: '为你的龙虾选择不同外形，解锁专属皮肤', status: 'planned', emoji: '🎨', vote_count: 128 },
  { id: '2', title: '手机端实时推送', description: '任务完成时，龙虾主动给你发通知', status: 'planned', emoji: '📱', vote_count: 97 },
  { id: '3', title: '可互动的龙虾', description: '点它、逗它，有真实互动和反应', status: 'planned', emoji: '✋', vote_count: 84 },
  { id: '4', title: '多 Agent 支持', description: '不止 OpenClaw，支持更多 AI Agent', status: 'future', emoji: '🌍', vote_count: 61 },
  { id: '5', title: '硬件设备', description: '一个放在桌上的实体伙伴，陪你工作', status: 'future', emoji: '🖥️', vote_count: 43 },
  { id: '6', title: '每日龙虾日记', description: '它用自己的视角，记录你们一起度过的每一天', status: 'future', emoji: '📖', vote_count: 39 },
];

const STATUS_CONFIG = {
  live:    { label: '已上线', color: '#83FFC1', text: '#000' },
  planned: { label: '计划中', color: '#FF94DB', text: '#000' },
  future:  { label: '大胆设想', color: '#8B8BFF', text: '#000' },
};

export default function Feedback() {
  const { user, signInWithGitHub } = useAuth();
  const [items, setItems] = useState([]);
  const [myVotes, setMyVotes] = useState(new Set());
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Load roadmap items + user votes
  useEffect(() => {
    if (!hasSupabase) {
      setItems(MOCK_ITEMS);
      setLoading(false);
      return;
    }
    supabase
      .from('roadmap_items')
      .select('*')
      .order('vote_count', { ascending: false })
      .then(({ data }) => {
        setItems(data?.length ? data : MOCK_ITEMS);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!hasSupabase || !user) return;
    supabase
      .from('roadmap_votes')
      .select('item_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setMyVotes(new Set(data.map(v => v.item_id)));
      });
  }, [user]);

  const toggleVote = async (itemId) => {
    if (!user) { signInWithGitHub(); return; }
    if (!hasSupabase) return;

    const hasVoted = myVotes.has(itemId);

    // Optimistic update
    setItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, vote_count: item.vote_count + (hasVoted ? -1 : 1) }
        : item
    ));
    setMyVotes(prev => {
      const next = new Set(prev);
      hasVoted ? next.delete(itemId) : next.add(itemId);
      return next;
    });

    if (hasVoted) {
      await supabase.from('roadmap_votes').delete()
        .eq('user_id', user.id).eq('item_id', itemId);
    } else {
      await supabase.from('roadmap_votes').insert({ user_id: user.id, item_id: itemId });
    }
  };

  const submitFeedback = async () => {
    if (!feedback.trim()) return;
    setSubmitLoading(true);
    if (hasSupabase) {
      await supabase.from('feedback_submissions').insert({
        user_id: user?.id ?? null,
        content: feedback.trim(),
      });
    }
    setSubmitted(true);
    setFeedback('');
    setSubmitLoading(false);
  };

  const grouped = {
    live:    items.filter(i => i.status === 'live'),
    planned: items.filter(i => i.status === 'planned'),
    future:  items.filter(i => i.status === 'future'),
  };

  return (
    <div className="fb-page">

      {/* ── Hero ── */}
      <section className="fb-hero">
        <p className="fb-eyebrow">开源 · 共同建造</p>
        <h1 className="fb-h1">
          你来决定<br />
          <em>它变成什么。</em>
        </h1>
        <p className="fb-sub">
          给你想要的功能投票，告诉我们你的想法。<br />
          你的每一票，都在影响下一个版本。
        </p>
        {!user && (
          <button className="fb-login-hint" onClick={signInWithGitHub}>
            用 GitHub 登录后才能投票 →
          </button>
        )}
      </section>

      {/* ── Voting board ── */}
      {loading ? (
        <div className="fb-loading">加载中...</div>
      ) : (
        <div className="fb-board">

          {grouped.live.length > 0 && (
            <div className="fb-group">
              <div className="fb-group-label" style={{ background: '#83FFC1' }}>已上线</div>
              <div className="fb-cards">
                {grouped.live.map(item => (
                  <VoteCard key={item.id} item={item} voted={myVotes.has(item.id)} onVote={toggleVote} user={user} />
                ))}
              </div>
            </div>
          )}

          {grouped.planned.length > 0 && (
            <div className="fb-group">
              <div className="fb-group-label" style={{ background: '#FF94DB' }}>计划中</div>
              <div className="fb-cards">
                {grouped.planned.map(item => (
                  <VoteCard key={item.id} item={item} voted={myVotes.has(item.id)} onVote={toggleVote} user={user} />
                ))}
              </div>
            </div>
          )}

          {grouped.future.length > 0 && (
            <div className="fb-group">
              <div className="fb-group-label" style={{ background: '#8B8BFF' }}>大胆设想</div>
              <div className="fb-cards">
                {grouped.future.map(item => (
                  <VoteCard key={item.id} item={item} voted={myVotes.has(item.id)} onVote={toggleVote} user={user} />
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── Feedback form ── */}
      <section className="fb-form-section">
        <div className="fb-form-inner">
          <p className="fb-eyebrow">没找到你想要的？</p>
          <h2 className="fb-form-h2">告诉我们<em>你的想法。</em></h2>
          {submitted ? (
            <div className="fb-thanks">
              <span className="fb-thanks-emoji">🎉</span>
              <p>收到了！感谢你的建议，我们会认真看的。</p>
              <button className="fb-submit-again" onClick={() => setSubmitted(false)}>再提一个 →</button>
            </div>
          ) : (
            <div className="fb-form">
              <textarea
                className="fb-textarea"
                placeholder="描述你希望 OpenPat 能做到的事情..."
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={4}
              />
              <div className="fb-form-actions">
                {!user && (
                  <span className="fb-form-hint">匿名提交，或 <button className="fb-link" onClick={signInWithGitHub}>登录</button> 后提交</span>
                )}
                <button
                  className="fb-submit"
                  onClick={submitFeedback}
                  disabled={!feedback.trim() || submitLoading}
                >
                  {submitLoading ? '提交中...' : '提交建议 →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="fb-cta">
        <Link to="/app" className="fb-cta-btn">← 回到我的龙虾</Link>
        <a href="https://github.com/ma2214889041/OpenPat" target="_blank" rel="noopener noreferrer" className="fb-cta-btn fb-cta-btn--outline">
          ⭐ Star on GitHub
        </a>
      </section>

    </div>
  );
}

function VoteCard({ item, voted, onVote, user }) {
  const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.planned;
  return (
    <div className={`fb-card ${voted ? 'fb-card--voted' : ''}`}>
      <div className="fb-card-emoji">{item.emoji}</div>
      <div className="fb-card-body">
        <div className="fb-card-title">{item.title}</div>
        {item.description && <div className="fb-card-desc">{item.description}</div>}
        <span className="fb-card-tag" style={{ background: cfg.color, color: cfg.text }}>{cfg.label}</span>
      </div>
      <button
        className={`fb-vote-btn ${voted ? 'fb-vote-btn--active' : ''}`}
        onClick={() => onVote(item.id)}
        title={user ? (voted ? '取消投票' : '投票') : '登录后投票'}
      >
        <span className="fb-vote-arrow">▲</span>
        <span className="fb-vote-count">{item.vote_count}</span>
      </button>
    </div>
  );
}
