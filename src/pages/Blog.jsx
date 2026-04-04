import { useEffect } from 'react';
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
  useEffect(() => { document.title = '博客 — OpenPat'; return () => { document.title = 'OpenPat — AI Companion with Memory'; }; }, []);
  return (
    <div className="blog-page">
      <nav className="blog-nav">
        <Link to="/" className="blog-nav-logo">OpenPat</Link>
        <div className="blog-nav-right">
          <Link to="/" className="blog-nav-link">首页</Link>
          <Link to="/chat" className="blog-nav-cta">开始聊天</Link>
        </div>
      </nav>

      <header className="blog-hero">
        <p className="blog-eyebrow">博客</p>
        <h1 className="blog-h1">想法与动态</h1>
        <p className="blog-intro">关于 AI 伴侣、记忆系统，以及接下来会发生什么。</p>
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
                <span className="blog-card-arrow">阅读 →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
