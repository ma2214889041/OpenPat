import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { hasSupabase } from '../utils/supabase';
import './SignIn.css';

const STATES_PREVIEW = [
  { label: '思考中', emoji: '🧠', color: '#FFE780', desc: 'Thinking' },
  { label: '工作中', emoji: '⚡', color: '#8B8BFF', desc: 'Working' },
  { label: '完成啦', emoji: '🎉', color: '#83FFC1', desc: 'Done' },
  { label: '摸鱼中', emoji: '💤', color: '#FF94DB', desc: 'Idle' },
  { label: '报错了', emoji: '💫', color: '#FF94DB', desc: 'Error' },
  { label: '离线中', emoji: '🌙', color: '#52525b', desc: 'Offline' },
];

export default function SignIn() {
  const { user, signInWithGitHub, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to app
  useEffect(() => {
    if (user) navigate('/chat');
  }, [user, navigate]);

  return (
    <div className="signin-page">

      {/* ── Left: Auth form ── */}
      <div className="signin-left">
        <div className="signin-form-wrap">

          {/* Logo */}
          <a href="/" className="signin-logo">
            <span className="signin-logo-icon">🐾</span>
            <span className="signin-logo-name">OpenPat</span>
          </a>

          <div className="signin-copy">
            <h1 className="signin-h1">开始你的旅程</h1>
            <p className="signin-sub">登录后可跨设备查看你的拍拍，并开启专属公开状态页。</p>
          </div>

          {hasSupabase ? (
            <div className="signin-btns">
              <button className="signin-btn signin-btn--github" onClick={signInWithGitHub}>
                <GitHubIcon />
                <span>用 GitHub 登录</span>
              </button>
              <button className="signin-btn signin-btn--google" onClick={signInWithGoogle}>
                <GoogleIcon />
                <span>用 Google 登录</span>
              </button>
            </div>
          ) : (
            <div className="signin-no-supabase">
              未配置 Supabase，登录不可用
            </div>
          )}

          <p className="signin-hint">
            不需要登录也能用 —&nbsp;
            <a href="/chat" className="signin-skip">直接进入 →</a>
          </p>

          <p className="signin-tos">
            登录即代表你同意我们的&nbsp;
            <span className="signin-tos-link">服务条款</span>
            &nbsp;和&nbsp;
            <span className="signin-tos-link">隐私政策</span>
          </p>

        </div>
      </div>

      {/* ── Right: Lobster showcase ── */}
      <div className="signin-right">
        <div className="signin-right-inner">
          <p className="signin-right-label">它有情绪。</p>
          <div className="signin-states-grid">
            {STATES_PREVIEW.map((s) => (
              <div key={s.desc} className="signin-state-card">
                {/* Placeholder — replace with actual sprite frames */}
                <div className="signin-state-img" style={{ '--glow': s.color }}>
                  <span className="signin-state-emoji">{s.emoji}</span>
                </div>
                <div className="signin-state-info">
                  <span className="signin-state-name">{s.label}</span>
                  <span className="signin-state-en">{s.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="signin-right-sub">连接你的 Agent，它实时感知你的工作状态。</p>
        </div>
      </div>

    </div>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
