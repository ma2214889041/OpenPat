import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../utils/supabase';
import './Connect.css';

export default function Connect() {
  const { user, username } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Load existing token if any
    supabase
      .from('api_tokens')
      .select('token')
      .eq('user_id', user.id)
      .eq('label', 'OpenPat')
      .maybeSingle()
      .then(({ data }) => { if (data) setToken(data.token); });
  }, [user]);

  async function generateToken() {
    setLoading(true);
    // Delete old token first, then insert new one
    await supabase.from('api_tokens').delete().eq('user_id', user.id).eq('label', 'OpenPat');
    const { data } = await supabase
      .from('api_tokens')
      .insert({ user_id: user.id, label: 'OpenPat' })
      .select('token')
      .single();
    setToken(data.token);
    setLoading(false);
  }

  async function copyToken() {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!user) {
    return (
      <div className="connect-page">
        <div className="connect-center">
          <p className="connect-login-hint">请先登录才能连接 Agent</p>
          <Link to="/signin" className="connect-btn connect-btn--primary">去登录 →</Link>
        </div>
      </div>
    );
  }

  const configJson = token
    ? JSON.stringify({
        endpoint: `${import.meta.env.VITE_SUPABASE_URL ?? ''}/functions/v1/event`,
        token,
      }, null, 2)
    : '';

  return (
    <div className="connect-page">

      <nav className="connect-nav">
        <a href="/" className="connect-nav-logo">OpenPat</a>
      </nav>

      <div className="connect-inner">

        <div className="connect-header">
          <div className="connect-avatar">
            {user.user_metadata?.avatar_url
              ? <img src={user.user_metadata.avatar_url} alt="" />
              : <span>{(username || '?')[0].toUpperCase()}</span>
            }
          </div>
          <h1 className="connect-h1">连接你的 Agent</h1>
          <p className="connect-sub">三步完成连接，之后拍拍会自动感知你的 Agent 状态。</p>
        </div>

        {/* Steps */}
        <div className="connect-steps">

          <div className="connect-step">
            <div className="connect-step-num">01</div>
            <div className="connect-step-body">
              <h3 className="connect-step-title">生成你的专属 Token</h3>
              <p className="connect-step-desc">Token 用于让 Agent skill 安全地向你的拍拍发送状态。</p>
              {token ? (
                <div className="connect-token-wrap">
                  <code className="connect-token">{token}</code>
                  <button className="connect-btn connect-btn--ghost" onClick={copyToken}>
                    {copied ? '已复制 ✓' : '复制'}
                  </button>
                  <button className="connect-btn connect-btn--text" onClick={generateToken} disabled={loading}>
                    重新生成
                  </button>
                </div>
              ) : (
                <button className="connect-btn connect-btn--primary" onClick={generateToken} disabled={loading}>
                  {loading ? '生成中…' : '生成 Token →'}
                </button>
              )}
            </div>
          </div>

          <div className={`connect-step${!token ? ' connect-step--dim' : ''}`}>
            <div className="connect-step-num">02</div>
            <div className="connect-step-body">
              <h3 className="connect-step-title">配置 Agent Skill</h3>
              <p className="connect-step-desc">把下面的 JSON 保存到 <code style={{fontFamily:'monospace',fontSize:'12px'}}>~/.openpat/openpat.json</code>：</p>
              {token && (
                <div className="connect-code-wrap">
                  <pre className="connect-code">{configJson}</pre>
                  <button className="connect-btn connect-btn--ghost connect-btn--sm" onClick={() => {
                    navigator.clipboard.writeText(configJson);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}>
                    {copied ? '已复制 ✓' : '复制 JSON'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={`connect-step${!token ? ' connect-step--dim' : ''}`}>
            <div className="connect-step-num">03</div>
            <div className="connect-step-body">
              <h3 className="connect-step-title">开始工作，看拍拍动起来</h3>
              <p className="connect-step-desc">连接成功后，Agent 每次工作都会实时更新你的拍拍状态。</p>
              {token && (
                <Link to="/app" className="connect-btn connect-btn--primary">
                  去看我的拍拍 →
                </Link>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
