import { useState } from 'react';
import { supabase, hasSupabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import './FeedbackModal.css';

export default function FeedbackModal({ onClose }) {
  const { user, signInWithGitHub } = useAuth();
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!feedback.trim()) return;
    setLoading(true);
    if (hasSupabase) {
      await supabase.from('feedback_submissions').insert({
        user_id: user?.id ?? null,
        content: feedback.trim(),
      });
    }
    setSubmitted(true);
    setFeedback('');
    setLoading(false);
  };

  return (
    <div className="fb-overlay" onClick={onClose}>
      <div className="fb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fb-modal-header">
          <span>💡 反馈</span>
          <button className="fb-modal-close" onClick={onClose}>✕</button>
        </div>

        {submitted ? (
          <div className="fb-modal-thanks">
            <span className="fb-thanks-emoji">🎉</span>
            <p>收到了！感谢你的反馈。</p>
            <button className="fb-submit-again" onClick={() => setSubmitted(false)}>
              再提一条 →
            </button>
          </div>
        ) : (
          <div className="fb-modal-body">
            <textarea
              className="fb-modal-textarea"
              placeholder="遇到了什么问题？有什么想要的功能？或者随便说说..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={5}
              autoFocus
            />
            <div className="fb-modal-actions">
              <span className="fb-modal-hint">
                {user ? `@${user.user_metadata?.user_name || user.email}` : (
                  <>匿名提交，或 <button className="fb-link" onClick={signInWithGitHub}>登录</button></>
                )}
              </span>
              <button
                className="fb-modal-submit"
                onClick={submit}
                disabled={!feedback.trim() || loading}
              >
                {loading ? '提交中...' : '提交 →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
