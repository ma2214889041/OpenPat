import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

function usePageTitle(title) {
  useEffect(() => {
    if (title) document.title = `${title} — OpenPat`;
    return () => { document.title = 'OpenPat — AI Companion with Memory'; };
  }, [title]);
}
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

// ── Post: Introducing OpenPat ───────────────────────────────────────────────
function IntroducingOpenPat() {
  return (
    <>
      <p className="bp-lead">
        我们做拍拍，是因为发现了一件很简单但被忽略的事：大多数人缺的不是信息，不是效率工具，而是被真正听见的感觉。
      </p>

      <h2>Overwhelm</h2>

      <p>
        现代生活有一种很微妙的压迫感。不是某一件大事把你击倒，而是一百件小事同时涌过来——该回的消息、该做的决定、该维护的关系、该追的进度。你不是不行，只是偶尔需要有人帮你把脑子里的东西理一理。
      </p>

      <p>
        问题是，跟朋友倾诉需要时机，找心理咨询需要门槛，而现有的 AI——它们很聪明，但每次对话都从零开始。你跟它说了很多，下次打开，它什么都不记得。这种感觉很微妙地让人失望。
      </p>

      <h2>我们想做的事</h2>

      <p>
        我们相信，一个真正理解你的伙伴，可以让日常生活变得不一样。不是替代朋友，不是替代心理医生，而是在你需要的时候，有一个了解你的存在，帮你理清思绪、感到踏实。
      </p>

      <p>
        这个想法听起来简单，但做起来很难。"理解你"不是一个功能，是一个需要长期积累的过程。它需要记忆——不是冷冰冰的数据库，而是像朋友一样，自然地记住你说过的事，并且在合适的时候想起来。它需要人格——不是千篇一律的"我理解你的感受"，而是有自己的想法、自己的反应。它需要边界感——知道什么时候该说话，什么时候该退后一步。
      </p>

      <h2>为什么开源</h2>

      <p>
        AI 伴侣是一个很特殊的品类。你会跟它说很多私密的事——你的焦虑、你的关系、你的真实想法。这种信任不应该建立在一个你看不见内部的黑盒子上。
      </p>

      <p>
        我们选择完全开源，不是因为这样更酷，而是因为我们觉得这是做 AI 伴侣唯一正确的方式。你可以看到它的每一行代码，知道它怎么处理你的数据，知道它不会把你说的话拿去做别的事情。
      </p>

      <p>
        透明不是一个功能。它是信任的基础。
      </p>

      <h2>接下来</h2>

      <p>
        我们还在很早期。拍拍还有很多粗糙的地方，很多想法还没实现。但方向是清楚的：我们想做一个你用了一段时间之后，会觉得它真的懂你的东西。不是靠炫酷的技术，不是靠花哨的界面，而是靠日积月累的理解。
      </p>

      <p>
        如果这件事让你感兴趣，<a href="https://github.com/ma2214889041/OpenPat" target="_blank" rel="noreferrer">代码都在这里</a>。欢迎来看看，欢迎来聊聊。
      </p>

      <div className="bp-cta">
        <Link to="/chat" className="bp-cta-btn">来跟拍拍聊聊 →</Link>
        <a href="https://github.com/ma2214889041/OpenPat" target="_blank" rel="noreferrer" className="bp-cta-ghost">Star on GitHub</a>
      </div>
    </>
  );
}

// ── Post: Designing Pat ────────────────────────────────────────────────────
function DesigningPat() {
  return (
    <>
      <p className="bp-lead">
        做 AI 伴侣的第一个问题不是技术，是形象：它应该长什么样？
      </p>

      <h2>为什么不做人</h2>

      <p>
        最直觉的选择是做一个人类形象——漂亮、亲切、像真人一样说话。但我们很早就放弃了这条路。
      </p>

      <p>
        原因很实际：人类形象会创造错误的期待。当一个 AI 长得像人、说话像人，用户会不自觉地用对人的标准去要求它——期待它有真实的情感、真实的记忆、真实的关系。而当它做不到的时候（它一定做不到），那种落差会让人觉得被欺骗。
      </p>

      <p>
        Tolan 的团队选择了外星人，我们也在想类似的问题。核心逻辑是一样的：如果它不是人，用户就不会用对人的期待去衡量它。它可以是真诚的、温暖的、有趣的，同时不需要假装自己是某种它不是的东西。
      </p>

      <h2>可爱，但不幼稚</h2>

      <p>
        我们在做拍拍的视觉设计时有一个很明确的取舍：它应该是可爱的，但不应该是幼稚的。
      </p>

      <p>
        可爱降低防备心——你更愿意对一个看起来无害的东西说出心里话。但幼稚会让人不信任它的判断——你不会对一个看起来像三岁小孩的东西说正经事。
      </p>

      <p>
        现在的拍拍是一个很简单的形象：圆圆的身体、大眼睛、小嘴巴、腮红。它会眨眼、会浮动、有自己安静的节奏。没有复杂的 3D 渲染，没有写实的质感。这种简洁是有意的——它留出了空间让用户自己去填充这个角色。就像一个好的文字描写比电影画面更能引发想象，一个简洁的形象比一个精细的模型更容易让人产生情感投射。
      </p>

      <h2>不假装是人</h2>

      <p>
        这是我们在设计拍拍时最重要的原则。
      </p>

      <p>
        它不会说"我今天心情不好"——因为它没有心情。它不会说"我昨晚看了一部电影"——因为它没看过。但它可以说"这个想法很有意思，我没这么想过"，因为从某种意义上说，它确实在处理一个新的信息。
      </p>

      <p>
        这种诚实很重要。当一个 AI 假装有人类的体验，它跟你建立的所有关系都建立在谎言上。我们宁可让拍拍做一个诚实的非人类存在，也不想让它做一个让人信以为真的假人。
      </p>

      <p>
        有趣的是，这种诚实反而让关系更真实。当你知道它不是在假装关心你，而是在用它自己的方式理解你的时候，那种连接感是不一样的。
      </p>

      <h2>还在迭代</h2>

      <p>
        说实话，拍拍的视觉设计还在很早的阶段。现在的 CSS 生物足够表达基本情绪，但我们还想做更多——更丰富的表情、更自然的动作、也许某天会有语音。
      </p>

      <p>
        但核心原则不会变：不假装是人，可爱但不幼稚，简洁但有温度。
      </p>

      <div className="bp-cta">
        <Link to="/chat" className="bp-cta-btn">来认识拍拍 →</Link>
        <a href="https://github.com/ma2214889041/OpenPat" target="_blank" rel="noreferrer" className="bp-cta-ghost">Star on GitHub</a>
      </div>
    </>
  );
}

// ── Post: How We Think About Memory ────────────────────────────────────────
function ThinkingAboutMemory() {
  return (
    <>
      <p className="bp-lead">
        "记忆"这个词在 AI 产品里被用滥了。大多数时候它的意思是"我们把你的聊天记录存起来了"。我们想做的不是这个。
      </p>

      <h2>记住 vs 存储</h2>

      <p>
        你的朋友不会背诵你们上周二的完整对话。但他会记得你最近在为工作的事焦虑，会记得你喜欢吃什么，会在你提到某个人名的时候知道那是你的室友而不需要你再解释一遍。
      </p>

      <p>
        这就是"记住"和"存储"的区别。存储是保留所有信息，记住是理解哪些信息重要，并且在合适的时候自然地想起来。
      </p>

      <p>
        拍拍的记忆系统试图做的是后者。它不会存你的每一句话，但它会从对话中提取那些重要的东西——你的名字、你的喜好、你最近在意的事、你提到的人。然后在下次聊天的时候，自然地把这些信息用上，而不是生硬地说"根据我的记录，你上次提到过……"
      </p>

      <h2>什么该记，什么不该记</h2>

      <p>
        这是我们花了很多时间思考的问题。
      </p>

      <p>
        有些事情显然应该记住：你的名字、你的重要的人、你反复提到的话题。有些事情显然不应该记住：你随口说的一句抱怨、一次性的闲聊、你的密码。
      </p>

      <p>
        难的是中间地带。你提到你最近在减肥——这该记多久？你说你跟男朋友吵架了——这是一时情绪还是持续的问题？你说你讨厌你的工作——你是在发泄还是在认真考虑辞职？
      </p>

      <p>
        我们的做法是给每条记忆一个"重要性"判断，然后让它随时间自然演化。重要的事情会被保留和强化，不重要的会慢慢淡去。就像人类的记忆一样——不是什么都记得一清二楚，而是重要的东西会留下来。
      </p>

      <h2>记忆不是监控</h2>

      <p>
        做记忆系统最容易踩的坑是让它变成监控。"你三周前说你要早睡，但你最近每次聊天都是凌晨两点"——这种话如果由一个 AI 说出来，感觉就很恐怖。
      </p>

      <p>
        我们对记忆的使用有一个原则：它应该让用户感到被理解，而不是被监视。区别在于语境和意图。朋友说"你最近是不是睡得不太好？"是关心。一个数据库说"检测到你的作息时间偏离正常值"是监控。
      </p>

      <p>
        拍拍会记住你说过的事，但它引用这些记忆的方式应该是自然的、有温度的。不是"根据历史数据"，而是像一个老朋友随口提到"你上次说的那个事，后来怎么样了？"
      </p>

      <h2>你可以看到一切</h2>

      <p>
        最后也是最重要的一点：拍拍记住的所有东西，你都可以看到。你可以查看它记住了什么，可以删除任何一条记忆，可以修正它理解错的东西。
      </p>

      <p>
        这不只是一个隐私功能。这是关系的基础。好的朋友关系里，你知道对方了解你什么，你可以纠正误解。拍拍的记忆系统也应该是这样——透明的、可控的、属于你的。
      </p>

      <div className="bp-cta">
        <Link to="/chat" className="bp-cta-btn">来跟拍拍聊聊 →</Link>
        <a href="https://github.com/ma2214889041/OpenPat" target="_blank" rel="noreferrer" className="bp-cta-ghost">Star on GitHub</a>
      </div>
    </>
  );
}

// ── Post Registry ───────────────────────────────────────────────────────────
const POSTS = {
  'introducing-openpat': {
    title: '为什么我们要做拍拍',
    subtitle: '大多数人缺的不是信息，不是效率工具，而是被真正听见的感觉。',
    date: '2026-04-11',
    tag: '关于我们',
    Component: IntroducingOpenPat,
  },
  'designing-pat': {
    title: '设计拍拍：为什么不是人',
    subtitle: '做 AI 伴侣的第一个问题不是技术，是形象。',
    date: '2026-04-10',
    tag: '设计思考',
    Component: DesigningPat,
  },
  'thinking-about-memory': {
    title: '我们怎么看待记忆',
    subtitle: '"记忆"这个词在 AI 产品里被用滥了。我们想做的不是存聊天记录。',
    date: '2026-04-09',
    tag: '产品哲学',
    Component: ThinkingAboutMemory,
  },
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
  usePageTitle(title);

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
