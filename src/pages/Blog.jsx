import { Link } from 'react-router-dom';
import './Blog.css';

const POSTS = [
  {
    slug: 'agent-pets-era',
    title: 'Claude Code 给你养了一只宠物',
    subtitle: '终端角落突然多了个小东西。没什么用，但你会忍不住看它一眼。',
    date: '2026-04-02',
    tag: '行业趋势',
  },
];

export default function Blog() {
  return (
    <div className="blog-page">
      <nav className="blog-nav">
        <Link to="/" className="blog-nav-logo">OpenPat</Link>
        <Link to="/chat" className="blog-nav-cta">Start Chatting</Link>
      </nav>

      <header className="blog-hero">
        <p className="blog-eyebrow">Blog</p>
        <h1 className="blog-h1">Ideas & Updates</h1>
        <p className="blog-intro">About AI companions, memory systems, and what comes next.</p>
      </header>

      <div className="blog-list">
        {POSTS.map((post) => (
          <Link to={`/blog/${post.slug}`} key={post.slug} className="blog-card">
            <div className="blog-card-inner">
              <span className="blog-card-tag">{post.tag}</span>
              <h2 className="blog-card-title">{post.title}</h2>
              <p className="blog-card-sub">{post.subtitle}</p>
              <div className="blog-card-footer">
                <span className="blog-card-date">{post.date}</span>
                <span className="blog-card-arrow">Read →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
