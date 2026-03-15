import { Link, useLocation } from 'react-router-dom';
import AuthButton from './AuthButton';
import './Navbar.css';

const LINKS = [
  { to: '/', label: '🦞 龙虾' },
  { to: '/team', label: '👥 团队' },
  { to: '/shop', label: '🛒 商店' },
  { to: '/leaderboard', label: '🏆 排行榜' },
];

export default function Navbar({ onSettings }) {
  const { pathname } = useLocation();
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">🦞</span>
        <span className="navbar-title">Lobster Pet</span>
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
      <div className="navbar-auth">
        <button className="nav-settings-btn" onClick={onSettings} title="设置 (,)">⚙️</button>
        <AuthButton />
      </div>
    </nav>
  );
}
