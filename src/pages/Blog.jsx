import { Link } from 'react-router-dom';
import './Blog.css';

const POSTS = [
  {
    slug: 'agent-pets-era',
    title: 'Claude Code 给你养了一只宠物',
    subtitle: '终端角落突然多了个小东西。没什么用，但你会忍不住看它一眼。',
    date: '2026-04-02',
    tag: '行业趋势',
    cover: '🐾',
  },
];

export default function Blog() {
  return (
    <div className="blog-page">
      <div className="blog-header">
        <Link to="/" className="blog-back">← 首页</Link>
        <h1 className="blog-title">OpenPat Blog</h1>
        <p className="blog-desc">关于 AI 宠物、数字陪伴与工作伙伴的思考</p>
      </div>
      <div className="blog-grid">
        {POSTS.map((post) => (
          <Link to={`/blog/${post.slug}`} key={post.slug} className="blog-card">
            <div className="blog-card-cover">{post.cover}</div>
            <div className="blog-card-body">
              <span className="blog-card-tag">{post.tag}</span>
              <h2 className="blog-card-title">{post.title}</h2>
              <p className="blog-card-sub">{post.subtitle}</p>
              <span className="blog-card-date">{post.date}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
