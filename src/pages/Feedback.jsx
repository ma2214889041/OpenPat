import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiPost } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import './Feedback.css';

export default function Feedback() {
  const { user, signInWithGitHub } = useAuth();
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!feedback.trim()) return;
    setLoading(true);
    try {
      await apiPost('/api/feedback', { content: feedback.trim() });
    } catch { /* ignore */ }
    setSubmitted(true);
    setFeedback('');
    setLoading(false);
  };

  return (
    <div className="fb-page">

      <section className="fb-hero">
        <p className="fb-eyebrow">OpenPat · 开源项目</p>
        <h1 className="fb-h1">
          你的想法<br />
          <em>让它变得更好。</em>
        </h1>
        <p className="fb-sub">
          遇到问题、有新想法、或者只是想说句话——<br />
          我们都想听。
        </p>
      </section>

      <section className="fb-form-section">
        <div className="fb-form-inner">
          {submitted ? (
            <div className="fb-thanks">
              <span className="fb-thanks-emoji">🎉</span>
              <p>收到了！感谢你的反馈，我们会认真看的。</p>
              <button className="fb-submit-again" onClick={() => setSubmitted(false)}>
                再提一条 →
              </button>
            </div>
          ) : (
            <div className="fb-form">
              <textarea
                className="fb-textarea"
                placeholder="遇到了什么问题？有什么想要的功能？或者随便说说..."
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={6}
              />
              <div className="fb-form-actions">
                <span className="fb-form-hint">
                  {user ? `以 @${user.user_metadata?.user_name || user.email} 身份提交` : (
                    <>匿名提交，或 <button className="fb-link" onClick={signInWithGitHub}>登录</button> 后提交</>
                  )}
                </span>
                <button
                  className="fb-submit"
                  onClick={submit}
                  disabled={!feedback.trim() || loading}
                >
                  {loading ? '提交中...' : '提交 →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="fb-cta">
        <Link to="/app" className="fb-cta-btn">← 回到我的拍拍</Link>
        <a
          href="https://github.com/ma2214889041/OpenPat"
          target="_blank"
          rel="noopener noreferrer"
          className="fb-cta-btn fb-cta-btn--outline"
        >
          ⭐ Star on GitHub
        </a>
      </section>

    </div>
  );
}
