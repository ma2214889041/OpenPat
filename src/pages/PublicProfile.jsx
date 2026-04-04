import { useParams, Link } from 'react-router-dom';
import './PublicProfile.css';

export default function PublicProfile() {
  const { username } = useParams();

  return (
    <div className="pp-page">
      <div className="pp-inner">
        <Link to="/" className="pp-back">← Home</Link>
        <h1 className="pp-title">@{username}</h1>
        <p className="pp-coming-soon">Public profile coming soon.</p>
        <Link to="/chat" className="pp-cta">Start chatting →</Link>
      </div>
    </div>
  );
}
