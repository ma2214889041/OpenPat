import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import './BlogPost.css';

// ── Post: Agent Pets Era ────────────────────────────────────────────────────
function AgentPetsEra() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <>
      <p className="bp-lead">
        2026 年 4 月，Claude Code 悄悄上线了一个功能：每位用户获得一只专属宠物伙伴，安静地坐在终端旁，
        观察你的对话并发出旁白。它叫 <strong>Buddy</strong>。
      </p>

      <p>
        这不是愚人节玩笑。越来越多的 AI 工具开始意识到：<strong>纯粹的效率不够，用户需要情感连接。</strong>
      </p>

      <h2>为什么 Agent 需要宠物？</h2>

      <p>
        当你凌晨三点还在 debug，AI Agent 在帮你跑测试——这个过程是孤独的。
        一个会对你的代码报错露出担忧表情的小生物，一个在你完成任务时开心蹦跳的伙伴，
        改变的不是效率，而是<strong>体验</strong>。
      </p>

      <p>
        心理学研究表明，人类天然会对表现出社交行为的虚拟角色产生情感依附——这被称为
        <strong>"电子鸡效应"（Tamagotchi Effect）</strong>。
        "它需要我"这个念头，激活了与其他数字互动完全不同的情感回路。
      </p>

      <h2>Claude Code 的 Buddy 系统是什么？</h2>

      <div className="bp-feature-grid">
        <div className="bp-feature">
          <span className="bp-feature-icon">🎲</span>
          <h3>确定性生成</h3>
          <p>每个用户 ID 对应唯一的宠物——相同的物种、眼睛、帽子、属性。你的 Buddy 只属于你。</p>
        </div>
        <div className="bp-feature">
          <span className="bp-feature-icon">🐾</span>
          <h3>18 个物种</h3>
          <p>鸭子、猫、龙、章鱼、水豚、仙人掌、蘑菇……每种都有 ASCII 字符画动画。</p>
        </div>
        <div className="bp-feature">
          <span className="bp-feature-icon">👀</span>
          <h3>上下文感知</h3>
          <p>Buddy 会分析你的对话内容——报错时它担忧，成功时它庆祝，提问时它思考。</p>
        </div>
        <div className="bp-feature">
          <span className="bp-feature-icon">⭐</span>
          <h3>稀有度系统</h3>
          <p>Common 60%、Uncommon 25%、Rare 10%、Epic 4%、Legendary 1%。还有 1% 闪光个体。</p>
        </div>
      </div>

      <h2>亲自试试</h2>

      <p>
        我们把 Buddy 的 Web 演示版做成了可交互的体验。输入任意 ID，看看你会得到什么样的伙伴：
      </p>

      <div className="bp-demo-wrap">
        {!showDemo ? (
          <button className="bp-demo-btn" onClick={() => setShowDemo(true)}>
            🐾 启动 Buddy 互动演示
          </button>
        ) : (
          <iframe
            src="/demos/buddy/index.html"
            className="bp-demo-iframe"
            title="Buddy Interactive Demo"
          />
        )}
      </div>

      <h2>这意味着什么？</h2>

      <p>
        当 Anthropic 这样的公司开始在命令行工具里加宠物，说明一件事：
        <strong>AI 工具的下一个战场不是性能，而是陪伴。</strong>
      </p>

      <p>这正是我们做 OpenPat 的原因。</p>

      <p>
        Buddy 是一个轻量的终端旁观者——ASCII 字符画，3 帧动画，5 种性格。
        而 OpenPat 想做的是一个<strong>有深度的工作伴侣</strong>：
      </p>

      <ul>
        <li>不只观察对话，而是<strong>感知你的 AI Agent 完整工作状态</strong></li>
        <li>不只发旁白，而是有<strong>关系递进和记忆系统</strong></li>
        <li>不只坐在终端旁，而是<strong>陪你计时、管理任务、记录成长</strong></li>
        <li>不只是你一个人看到，而是有<strong>公开主页、分享卡片、成就系统</strong></li>
      </ul>

      <p>
        Agent 宠物的时代刚刚开始。我们相信，最好的 AI 不只是帮你干活的工具，
        它值得一份真正的陪伴。
      </p>

      <div className="bp-cta">
        <Link to="/app" className="bp-cta-btn">唤醒你的拍拍 →</Link>
      </div>
    </>
  );
}

// ── Post Registry ───────────────────────────────────────────────────────────
const POSTS = {
  'agent-pets-era': {
    title: 'AI Agent 的宠物时代来了',
    subtitle: '为什么 Claude Code、Cursor 等工具开始给用户养宠物？',
    date: '2026-04-02',
    tag: '行业趋势',
    Component: AgentPetsEra,
  },
};

export default function BlogPost() {
  const { slug } = useParams();
  const post = POSTS[slug];

  if (!post) {
    return (
      <div className="bp-page">
        <div className="bp-inner">
          <h1>404 — 文章不存在</h1>
          <Link to="/blog">← 返回博客</Link>
        </div>
      </div>
    );
  }

  const { title, subtitle, date, tag, Component } = post;

  return (
    <div className="bp-page">
      <div className="bp-inner">
        <Link to="/blog" className="bp-back">← 博客</Link>
        <div className="bp-meta">
          <span className="bp-tag">{tag}</span>
          <span className="bp-date">{date}</span>
        </div>
        <h1 className="bp-title">{title}</h1>
        <p className="bp-subtitle">{subtitle}</p>
        <article className="bp-content">
          <Component />
        </article>
      </div>
    </div>
  );
}
