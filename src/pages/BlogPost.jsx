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
        四月的某个早晨，打开 Claude Code，终端角落里多了一只小动物。
        ASCII 字符画的身体，一帧一帧地晃动，偶尔冒出一句旁白。它叫 <strong>Buddy</strong>。
      </p>

      <p>
        它不会帮你写代码，也不会帮你 debug。它只是在那儿——看着你工作，用自己的方式回应你正在经历的一切。
        代码报错了，它露出紧张的表情；测试跑通了，它比你还开心。
      </p>

      <p>
        这大概是 Anthropic 做过的最不"实用"的功能。但正因如此，它值得被认真对待。
      </p>

      <h2>关于陪伴这件事</h2>

      <p>
        我们每天和 AI 协作很多个小时。它帮你写代码、跑测试、查文档——然后等待下一条指令。
        这个过程高效、精确，但也安静得有些过头。
      </p>

      <p>
        Buddy 做了一件很小的事：它让你在工作的间隙，感受到有什么在注意你。
        不是提醒，不是建议，只是一个小小的存在感——就像深夜加班时，发现窗台上的猫也醒着，正看着你。
      </p>

      <h2>18 个物种</h2>

      <p>Buddy 有 <strong>18 种</strong>形态，全部是手绘 ASCII 字符画。点击看看它们：</p>

      <SpeciesGallery />

      <h2>只属于你的那一只</h2>

      <p>
        Buddy 不是随机的。你的用户 ID 决定了你会遇到哪只——同样的物种、同样的眼睛、同样的帽子。
        换一台电脑登录，它还在那里，跟昨天一模一样。
        这个设计让 Buddy 不再是一个功能，而更接近一段关系的起点：它是你的，从一开始就是。
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

      <h2>Buddy 与拍拍</h2>

      <p>
        Buddy 是一个安静的旁观者——ASCII 画风、嵌在终端里、从不打扰你的工作流。
        这种克制本身就是一种温柔。
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
        而拍拍想走得更远一些。如果它能记住你的工作节奏，知道你什么时候专注、什么时候疲惫；
        如果你们之间的关系会随时间变化，从陌生到默契——那种陪伴感，会不会更接近"真实"？
      </p>

      <p>
        Buddy 让我们看到，即使是最简单的存在感，也能让日复一日的工作变得不太一样。
        拍拍想做的，是把这份感受再往前带一步。
      </p>

      <div className="bp-cta">
        <Link to="/app" className="bp-cta-btn">认识你的拍拍 →</Link>
        <a href="https://github.com/ma2214889041/OpenPat" target="_blank" rel="noreferrer" className="bp-cta-ghost">⭐ Star on GitHub</a>
      </div>
    </>
  );
}

// ── Post Registry ───────────────────────────────────────────────────────────
const POSTS = {
  'agent-pets-era': {
    title: '终端里来了一只小动物',
    subtitle: 'Claude Code 上线了 Buddy——一只不会帮你写代码，但会陪你写代码的宠物。',
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
