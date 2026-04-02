import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import './BlogPost.css';

// ── ASCII Sprite Data (from Buddy source) ───────────────────────────────────
const SPECIES_DATA = [
  { id: 'duck',     name: '鸭子',   emoji: '🦆', frames: [['            ','    __      ','  <(· )___  ','   (  ._>   ','    `--´    '],['            ','    __      ','  <(· )___  ','   (  ._>   ','    `--´~   ']] },
  { id: 'goose',    name: '鹅',     emoji: '🪿', frames: [['            ','     (·>    ','     ||     ','   _(__)_   ','    ^^^^    '],['            ','    (·>     ','     ||     ','   _(__)_   ','    ^^^^    ']] },
  { id: 'blob',     name: '果冻',   emoji: '🫧', frames: [['            ','   .----.   ','  ( ·  · )  ','  (      )  ','   `----´   '],['            ','  .------.  ',' (  ·  ·  ) ',' (        ) ','  `------´  ']] },
  { id: 'cat',      name: '猫',     emoji: '🐱', frames: [['            ','   /\\_/\\    ','  ( ·   ·)  ','  (  ω  )   ','  (")_(")   '],['            ','   /\\_/\\    ','  ( ·   ·)  ','  (  ω  )   ','  (")_(")~  ']] },
  { id: 'dragon',   name: '龙',     emoji: '🐲', frames: [['            ','  /^\\  /^\\  ',' <  ·  ·  > ',' (   ~~   ) ','  `-vvvv-´  '],['   ~    ~   ','  /^\\  /^\\  ',' <  ·  ·  > ',' (   ~~   ) ','  `-vvvv-´  ']] },
  { id: 'octopus',  name: '章鱼',   emoji: '🐙', frames: [['            ','   .----.   ','  ( ·  · )  ','  (______)  ','  /\\/\\/\\/\\  '],['            ','   .----.   ','  ( ·  · )  ','  (______)  ','  \\/\\/\\/\\/  ']] },
  { id: 'owl',      name: '猫头鹰', emoji: '🦉', frames: [['            ','   /\\  /\\   ','  ((·)(·))  ','  (  ><  )  ','   `----´   '],['            ','   /\\  /\\   ','  ((·)(·))  ','  (  ><  )  ','   .----.   ']] },
  { id: 'penguin',  name: '企鹅',   emoji: '🐧', frames: [['            ','  .---.     ','  (·>·)     ',' /(   )\\    ','  `---´     '],['            ','  .---.     ','  (·>·)     ',' |(   )|    ','  `---´     ']] },
  { id: 'turtle',   name: '海龟',   emoji: '🐢', frames: [['            ','   _,--._   ','  ( ·  · )  ',' /[______]\\ ','  ``    ``  '],['            ','   _,--._   ','  ( ·  · )  ',' /[______]\\ ','   ``  ``   ']] },
  { id: 'snail',    name: '蜗牛',   emoji: '🐌', frames: [['            ',' ·    .--.  ','  \\  ( @ )  ','   \\_`--´   ','  ~~~~~~~   '],['            ','  ·   .--.  ','  |  ( @ )  ','   \\_`--´   ','  ~~~~~~~   ']] },
  { id: 'ghost',    name: '幽灵',   emoji: '👻', frames: [['            ','   .----.   ','  / ·  · \\  ','  |      |  ','  ~`~``~`~  '],['            ','   .----.   ','  / ·  · \\  ','  |      |  ','  `~`~~`~`  ']] },
  { id: 'axolotl',  name: '六角龙', emoji: '🦎', frames: [['}~(______)~{','}~(· .. ·)~{','  ( .--. )  ','  (_/  \\_)  ','            '],['~}(______){~','~}(· .. ·){~','  ( .--. )  ','  (_/  \\_)  ','            ']] },
  { id: 'capybara', name: '水豚',   emoji: '🦫', frames: [['            ','  n______n  ',' ( ·    · ) ',' (   oo   ) ','  `------´  '],['            ','  n______n  ',' ( ·    · ) ',' (   Oo   ) ','  `------´  ']] },
  { id: 'cactus',   name: '仙人掌', emoji: '🌵', frames: [['            ',' n  ____  n ',' | |·  ·| | ',' |_|    |_| ','   |    |   '],['            ','    ____    ',' n |·  ·| n ',' |_|    |_| ','   |    |   ']] },
  { id: 'robot',    name: '机器人', emoji: '🤖', frames: [['            ','   .[||].   ','  [ ·  · ]  ','  [ ==== ]  ','  `------´  '],['            ','   .[||].   ','  [ ·  · ]  ','  [ -==- ]  ','  `------´  ']] },
  { id: 'rabbit',   name: '兔子',   emoji: '🐰', frames: [['            ','   (\\__/)   ','  ( ·  · )  ',' =(  ..  )= ','  (")__(")  '],['            ','   (|__/)   ','  ( ·  · )  ',' =(  ..  )= ','  (")__(")  ']] },
  { id: 'mushroom', name: '蘑菇',   emoji: '🍄', frames: [['            ',' .-o-OO-o-. ','(__________)','   |·  ·|   ','   |____|   '],['            ',' .-O-oo-O-. ','(__________)','   |·  ·|   ','   |____|   ']] },
  { id: 'chonk',    name: '胖橘',   emoji: '🐈', frames: [['            ','  /\\    /\\  ',' ( ·    · ) ',' (   ..   ) ','  `------´  '],['            ','  /\\    /|  ',' ( ·    · ) ',' (   ..   ) ','  `------´  ']] },
];

const RARITY_INFO = [
  { name: 'Common',    stars: '★',     color: '#5a6472', chance: '60%' },
  { name: 'Uncommon',  stars: '★★',    color: '#15803d', chance: '25%' },
  { name: 'Rare',      stars: '★★★',   color: '#1d4ed8', chance: '10%' },
  { name: 'Epic',      stars: '★★★★',  color: '#7c3aed', chance: '4%' },
  { name: 'Legendary', stars: '★★★★★', color: '#b45309', chance: '1%' },
];

const HATS = [
  { id: 'crown',     label: '皇冠',   art: '\\^^^/' },
  { id: 'tophat',    label: '礼帽',   art: '[___]' },
  { id: 'propeller', label: '螺旋桨', art: ' -+- ' },
  { id: 'halo',      label: '光环',   art: '(   )' },
  { id: 'wizard',    label: '巫师帽', art: ' /^\\ ' },
  { id: 'beanie',    label: '毛线帽', art: '(___)' },
  { id: 'tinyduck',  label: '小鸭子', art: ' ,>  ' },
];

const EYES = ['·', '✦', '×', '◉', '@', '°'];

// ── Animated Sprite Component ───────────────────────────────────────────────
function AsciiSprite({ frames, size = 'normal' }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % frames.length), 600);
    return () => clearInterval(id);
  }, [frames.length]);
  return (
    <pre className={`bp-ascii ${size === 'small' ? 'bp-ascii--sm' : ''}`}>
      {frames[frame].join('\n')}
    </pre>
  );
}

// ── Species Gallery ─────────────────────────────────────────────────────────
function SpeciesGallery() {
  const [selected, setSelected] = useState(null);
  const s = selected !== null ? SPECIES_DATA[selected] : null;

  return (
    <div className="bp-gallery">
      <div className="bp-gallery-grid">
        {SPECIES_DATA.map((sp, i) => (
          <button
            key={sp.id}
            className={`bp-species-btn ${selected === i ? 'bp-species-btn--active' : ''}`}
            onClick={() => setSelected(selected === i ? null : i)}
          >
            <AsciiSprite frames={sp.frames} size="small" />
            <span className="bp-species-name">{sp.emoji} {sp.name}</span>
          </button>
        ))}
      </div>
      {s && (
        <div className="bp-species-detail">
          <AsciiSprite frames={s.frames} />
          <div className="bp-species-info">
            <h3>{s.emoji} {s.name} <span className="bp-species-id">({s.id})</span></h3>
            <p>点击上方任意物种查看动画。每个物种有 2-3 帧 idle 动画，会呼吸、摇摆、眨眼。</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Post: Agent Pets Era ────────────────────────────────────────────────────
function AgentPetsEra() {


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
        心理学研究称之为<strong>"电子鸡效应"（Tamagotchi Effect）</strong>——
        人类天然会对表现出社交行为的虚拟角色产生情感依附。
        "它需要我"这个念头，激活了与其他数字互动完全不同的情感回路。
      </p>

      <div className="bp-callout">
        <span className="bp-callout-icon">💡</span>
        <p>游戏化市场 2025 年价值超过 <strong>154 亿美元</strong>，预计 2029 年达 487 亿。AI 伴侣应用 2025 年下载量同比增长 <strong>88%</strong>。</p>
      </div>

      <h2>Claude Code 的 Buddy 长什么样？</h2>

      <p>Buddy 拥有 <strong>18 个物种</strong>，每个都是手绘的 ASCII 字符画。点击查看它们：</p>

      <SpeciesGallery />

      <h2>确定性生成：你的 Buddy 只属于你</h2>

      <p>
        Buddy 不是随机的。它用 <code>FNV-1a</code> 哈希算法，根据你的用户 ID 确定性地生成——
        同一个账号永远得到同一个物种、同样的眼睛、帽子和属性值。
      </p>

      <div className="bp-feature-grid">
        <div className="bp-feature">
          <span className="bp-feature-icon">👁️</span>
          <h3>6 种眼型</h3>
          <div className="bp-eyes-row">
            {EYES.map(e => <span key={e} className="bp-eye-chip">{e}</span>)}
          </div>
        </div>
        <div className="bp-feature">
          <span className="bp-feature-icon">🎩</span>
          <h3>7 种帽子</h3>
          <div className="bp-hats-row">
            {HATS.map(h => <span key={h.id} className="bp-hat-chip" title={h.label}><pre>{h.art}</pre></span>)}
          </div>
        </div>
      </div>

      <h2>稀有度系统</h2>

      <div className="bp-rarity-table">
        {RARITY_INFO.map(r => (
          <div key={r.name} className="bp-rarity-row">
            <span className="bp-rarity-stars" style={{ color: r.color }}>{r.stars}</span>
            <span className="bp-rarity-name" style={{ color: r.color }}>{r.name}</span>
            <span className="bp-rarity-chance">{r.chance}</span>
            <div className="bp-rarity-bar">
              <div className="bp-rarity-fill" style={{ width: r.chance, background: r.color }} />
            </div>
          </div>
        ))}
        <p className="bp-rarity-note">另外还有 <strong>1%</strong> 概率获得闪光（Shiny）个体 ✨</p>
      </div>

      <h2>上下文感知：它在看你写代码</h2>

      <p>Buddy 不只是坐在那里。它的 Observer 系统会分析你的对话内容，选择合适的反应：</p>

      <div className="bp-reaction-grid">
        {[
          { trigger: '报错', reaction: '"oh no..." *nervous wiggle*', emoji: '😰' },
          { trigger: '成功', reaction: '"yay!!" *wiggles excitedly*', emoji: '🎉' },
          { trigger: '提问', reaction: '"hmm..." *thinks*', emoji: '🤔' },
          { trigger: '使用工具', reaction: '"noted" *takes notes*', emoji: '📝' },
          { trigger: '长文本', reaction: '"deep thoughts incoming" *focused*', emoji: '🧠' },
          { trigger: '抚摸它', reaction: '♥ *happy wiggle*', emoji: '💕' },
        ].map(r => (
          <div key={r.trigger} className="bp-reaction-card">
            <span className="bp-reaction-emoji">{r.emoji}</span>
            <strong>{r.trigger}</strong>
            <span className="bp-reaction-text">{r.reaction}</span>
          </div>
        ))}
      </div>

      <h2>Buddy vs OpenPat：轻量旁观 vs 深度陪伴</h2>

      <div className="bp-compare-table">
        <div className="bp-compare-header">
          <span />
          <span>Buddy</span>
          <span>OpenPat</span>
        </div>
        {[
          ['形态', 'ASCII 字符画', 'SVG 矢量动画'],
          ['位置', '终端内旁白', '独立 Web 应用'],
          ['感知', '分析对话文本', '实时 Agent 状态'],
          ['互动', '摸它 / 静音', '番茄钟 / Todo / 成就'],
          ['个性', '5 种预设', '动态成长 + 关系阶段'],
          ['社交', '无', '公开主页 / 分享卡片'],
          ['记忆', '无', '工作习惯 / 情绪记录'],
        ].map(([label, buddy, openpat]) => (
          <div key={label} className="bp-compare-row">
            <span className="bp-compare-label">{label}</span>
            <span>{buddy}</span>
            <span className="bp-compare-highlight">{openpat}</span>
          </div>
        ))}
      </div>

      <h2>这意味着什么？</h2>

      <p>
        当 Anthropic 这样的公司开始在命令行工具里加宠物，说明一件事：
        <strong>AI 工具的下一个战场不是性能，而是陪伴。</strong>
      </p>

      <p>
        Buddy 是一个优雅的起点——轻量、确定性、不打扰。
        而 OpenPat 想做的是下一步：一个<strong>有深度的工作伴侣</strong>，
        不只观察你的对话，而是真正理解你的工作节奏，记住你的习惯，陪你成长。
      </p>

      <p>Agent 宠物的时代刚刚开始。</p>

      <div className="bp-cta">
        <Link to="/app" className="bp-cta-btn">唤醒你的拍拍 →</Link>
        <a href="https://github.com/ma2214889041/OpenPat" target="_blank" rel="noreferrer" className="bp-cta-ghost">⭐ Star on GitHub</a>
      </div>
    </>
  );
}

// ── Post Registry ───────────────────────────────────────────────────────────
const POSTS = {
  'agent-pets-era': {
    title: 'AI Agent 的宠物时代来了',
    subtitle: '当 Claude Code 开始给你养宠物，说明 AI 的下一个战场不是性能——而是陪伴。',
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
