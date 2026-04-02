import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthButton from './AuthButton';
import { useAuth } from '../hooks/useAuth';
import { hasSupabase } from '../utils/supabase';
import './Navbar.css';

const LINKS = [
  { to: '/app', label: '主页' },
  { to: '/achievements', label: '成就' },
];

export default function Navbar({ onSettings, onFeedback }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [mobileMenu, setMobileMenu] = useState(false);
  return (
    <>
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/app" className="navbar-brand-link">
          <span className="navbar-logo">🐾</span>
          <span className="navbar-title">OpenPat</span>
        </Link>
      </div>
      <div className="navbar-links">
        {LINKS.map(l => (
          <Link
            key={l.to}
            to={l.to}
            className={`nav-link ${pathname === l.to ? 'active' : ''}`}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div className="navbar-auth navbar-auth-desktop">
        {onFeedback && (
          <button className="nav-icon-btn" onClick={onFeedback} title="反馈">💡</button>
        )}
        {!user && (
          <button className="nav-icon-btn" onClick={onSettings} title="设置">⚙️</button>
        )}
        {hasSupabase && !user && (
          <Link to="/signin" className="nav-signin-btn">登录</Link>
        )}
        <AuthButton onSettings={onSettings} />
      </div>
      <button className="navbar-burger" onClick={() => setMobileMenu(v => !v)} aria-label="Menu">
        <span /><span /><span />
      </button>
    </nav>
    {mobileMenu && (
      <div className="navbar-mobile-menu">
        {LINKS.map(l => (
          <Link
            key={l.to}
            to={l.to}
            className={`navbar-mobile-link ${pathname === l.to ? 'active' : ''}`}
            onClick={() => setMobileMenu(false)}
          >
            {l.label}
          </Link>
        ))}
        <div className="navbar-mobile-auth">
          {onFeedback && (
            <button className="navbar-mobile-link" onClick={() => { onFeedback(); setMobileMenu(false); }}>💡 反馈</button>
          )}
          {!user && (
            <button className="navbar-mobile-link" onClick={() => { onSettings?.(); setMobileMenu(false); }}>⚙️ 设置</button>
          )}
          {hasSupabase && !user && (
            <Link to="/signin" className="navbar-mobile-signin" onClick={() => setMobileMenu(false)}>登录 / 注册</Link>
          )}
          {user && <AuthButton onSettings={onSettings} />}
        </div>
      </div>
    )}
    </>
  );
}
