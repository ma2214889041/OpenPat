import { Link, useLocation } from 'react-router-dom';
import AuthButton from './AuthButton';
import './Navbar.css';

const LINKS = [
  { to: '/', label: '🦞 我的龙虾' },
  { to: '/leaderboard', label: '🌐 龙虾广场' },
];

export default function Navbar({ onSettings }) {
  const { pathname } = useLocation();
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">🦞</span>
        <span className="navbar-title">OpenPat</span>
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
        <button className="nav-settings-btn" onClick={onSettings} title="设置">⚙️</button>
        <AuthButton />
      </div>
    </nav>
  );
}
