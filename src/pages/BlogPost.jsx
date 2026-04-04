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
            <span className="bp-species-name">{sp.name}</span>
          </button>
        ))}
      </div>
      {s && (
        <div className="bp-species-detail">
          <AsciiSprite frames={s.frames} />
          <div className="bp-species-info">
            <h3>{s.name} <span className="bp-species-id">({s.id})</span></h3>
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
        今天打开 Claude Code，发现终端角落多了个小东西——一只用 ASCII 画的小动物，安安静静蹲在那儿，偶尔冒一句旁白。
        它叫 <strong>Buddy</strong>。
      </p>

      <p>
        第一反应是愚人节整活（确实是 4 月 1 号上线的）。但用了一会儿发现，写代码的时候旁边有个小生物在，
        感觉还真不一样。报错的时候它一脸紧张，跑通测试它比你还高兴。没什么实际用处，但就是会让你嘴角翘一下。
      </p>

      <h2>为什么写代码需要一只宠物？</h2>

      <p>
        说实话，大部分时间写代码是孤独的。尤其是深夜 debug，对着一堆 stack trace 发呆的时候。
        AI 可以帮你写代码、跑测试、查文档，但它终究是个工具——用完就关，没有任何情感上的回应。
      </p>

      <p>
        Buddy 做的事情很小：它只是在旁边待着，用一两句话回应你正在做的事。
        但这种"被陪伴"的感觉，比你想象的更有意义。就像桌上放一盆植物，不会帮你干活，但你就是会看它一眼然后心情好一点。
      </p>

      <h2>Buddy 长什么样？</h2>

      <p>一共 <strong>18 个物种</strong>，全是 ASCII 字符画风格，像素感拉满。点击看看它们：</p>

      <SpeciesGallery />

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

      <h2>Buddy 和拍拍，走的是不同的路</h2>

      <p>
        Buddy 很克制——ASCII 画风、终端里待着、不主动打扰。它更像一个安静的旁观者。
        这种设计很聪明：对于每天泡在终端里的开发者来说，恰到好处。
      </p>

      <div className="bp-compare-table">
        <div className="bp-compare-header">
          <span />
          <span>Buddy</span>
          <span>拍拍</span>
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

      <p>
        我们做拍拍的时候想的是另一件事：如果这个伙伴不只是"在旁边待着"，而是真的能记住你的工作习惯、
        理解你今天是高产还是摆烂、甚至在你连续加班的时候提醒你休息一下——那会是什么样的体验？
      </p>

      <p>
        不是说哪个更好。Buddy 证明了一件事：开发者确实需要一点陪伴感。
        而我们想看看，这份陪伴能走多远。
      </p>

      <div className="bp-cta">
        <Link to="/chat" className="bp-cta-btn">来认识你的拍拍 →</Link>
        <a href="https://github.com/ma2214889041/OpenPat" target="_blank" rel="noreferrer" className="bp-cta-ghost">⭐ Star on GitHub</a>
      </div>
    </>
  );
}

// ── Post Registry ───────────────────────────────────────────────────────────
const POSTS = {
  'agent-pets-era': {
    title: 'Claude Code 给你养了一只宠物',
    subtitle: '终端角落突然多了个小东西。没什么用，但你会忍不住看它一眼。',
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
