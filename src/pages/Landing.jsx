import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { hasSupabase } from '../utils/supabase';
import { loadSiteConfig } from '../utils/supabaseStorage';
import './Landing.css';

// ── Bilingual copy ────────────────────────────────────────────────────────────
const COPY = {
  zh: {
    nav: {
      about:    '关于',
      share:    '分享',
      feedback: '反馈',
      publicProfile: '🌐 公开状态页',
      openApp:  '进入应用',
      signOut:  '退出登录',
      signIn:   '登录 / 注册',
    },
    hero: {
      eyebrow: 'AI 时代的电子宠物',
      h1:      ['你曾希望那只小宠物，', '能真正懂你。'],
      sub1:    '在 AI 时代，这件事或许真的可以了。',
      sub2:    '连接你的 Agent，OpenPat 会实时感受它的状态 — 陪你经历每一个当下，见证你们一起走过的每一步。',
      cta:     '唤醒你的伙伴 →',
      more:    '了解更多 ↓',
    },
    marquee: [
      '陪你工作', '见证每一步', '一起成长', '解锁成就',
      '专属状态页', '多设备同步', '慢慢发现', '隐藏彩蛋',
      '一键分享', '记录你的故事', '它有情绪', '真实陪伴',
    ],
    how: {
      eyebrow: '三步开始',
      h2: ['简单到', '不需要教程。'],
      steps: [
        {
          title: '连接 Agent',
          desc:  '在设置页面生成 API Token，复制 JSON 配置到',
          code:  '~/.openpat/openpat.json',
          desc2: '，或运行',
          code2: 'npx open-pat',
          desc3: '一键自动完成。',
          link:  '获取连接 Token →',
        },
        {
          title: '它活过来',
          desc:  '你的伙伴开始实时感知你的工作状态。思考、执行、完成、休息——每个时刻都被记录。',
        },
        {
          title: '分享你的故事',
          desc:  '专属主页自动生成，成就、等级、历程一目了然。一键发给朋友，让他们来见证你。',
        },
      ],
    },
    about: {
      desc: '小时候的电子宠物让你想要更多 —— 更多互动，更多陪伴，更多真实的情感连接。\n在 AI 时代，OpenPat 想把这件事做到。',
      cta:  '唤醒你的伙伴 →',
    },
    states: {
      eyebrow: '它有情绪。',
      h2: ['这只是', '开始。'],
      body: '你看到的，只是冰山一角。',
      cards: ['思考中', '工作中', '完成啦！', '摸鱼中', '？？？', '还有更多'],
    },
    share: {
      eyebrow: '你的故事，值得被看见。',
      h2: ['分享给', '你的朋友。'],
      body1: '专属状态页、成就记录、成长历程——\n这是只属于你的故事。',
      body2: '一键生成分享卡片，发给朋友，让他们看见你的每一个进步。',
      cta:   '唤醒你的伙伴 →',
      demo:  '查看示例主页 →',
      cardName:   '你的名字',
      cardStatus: '⚡ 工作中',
      cardLabel:  '本周任务',
      cardGif:    '动态分享卡片',
    },
    shorts: {
      eyebrow: '它的故事。',
      h2: ['陪伴的', '每一面。'],
      body: '比你想象的更有戏。',
      cards: ['凌晨三点还在想', '摸鱼也是艺术', '终于提交了', '目标达成', '下班了', '专注模式开启'],
    },
    roadmap: {
      eyebrow: '开源 · 持续进化',
      h2: ['我们正在', '构建什么。'],
      body: 'OpenPat 刚刚开始。这是我们的计划——你的参与会让它更快到来。',
      tagDone: '已上线',
      tagSoon: '即将推出',
      tagFuture: '大胆设想',
      items: [
        { tag: 'done', title: '实时状态陪伴', desc: '连接 AI Agent，伙伴实时感知你的工作状态，陪你度过每一个任务。' },
        { tag: 'done', title: '成就系统', desc: '完成里程碑自动解锁成就徽章，记录你们每一个共同经历的时刻。' },
        { tag: 'done', title: '专属公开主页', desc: '一键生成你的专属主页，把你们的故事分享给朋友。' },
        { tag: 'soon', title: '🎨 皮肤 & 形象系统', desc: '为你的伙伴选择独特的外形——目前开放管理员上传，更多样式即将开放。' },
        { tag: 'soon', title: '📱 手机端实时推送', desc: '注册后，伙伴会主动给你发消息——它有话想对你说，不只是等你来看它。' },
        { tag: 'soon', title: '🎭 更多有趣内容', desc: '它会有自己的想法、随机事件、专属对话，每天打开都有新鲜感。' },
        { tag: 'soon', title: '✋ 可互动的伙伴', desc: '点它、逗它、喂它——不再只是看，你们之间会有真实的互动和反应。' },
        { tag: 'future', title: '🖥️ 硬件设备', desc: '也许有一天，它会从屏幕里走出来——一个放在桌上的实体伙伴，陪你工作。' },
        { tag: 'future', title: '🌍 多 Agent 生态', desc: '不止一种 AI Agent，让你的伙伴能感知更广阔的数字世界。' },
      ],
      github: '这是一个开源项目。你的 Star 让我们知道它值得被做。',
      star: '⭐ Star on GitHub',
    },
    cta: {
      eyebrow: '随时开始。',
      h2: ['找到', '属于你的', '那份陪伴。'],
      body: '连接 Agent，开始你们的故事。\n然后，把它分享给你在乎的人。',
      start: '立刻开始',
    },
    footer: {
      tos: '服务条款',
      privacy: '隐私政策',
      copy: '© 2026 OpenPat',
    },
  },

  en: {
    nav: {
      about:    'About',
      share:    'Share',
      feedback: 'Feedback',
      publicProfile: '🌐 My Public Page',
      openApp:  'Open App',
      signOut:  'Sign Out',
      signIn:   'Sign In / Sign Up',
    },
    hero: {
      eyebrow: 'The Digital Pet for the AI Era',
      h1:      ['You always wanted a digital pet', 'that truly knew you.'],
      sub1:    'In the age of AI, that might finally be possible.',
      sub2:    'Connect your AI Agent and OpenPat will sense its state in real time — walking with you through every moment, witnessing every step you take together.',
      cta:     'Awaken your companion →',
      more:    'Learn more ↓',
    },
    marquee: [
      'With you at work', 'Witness every step', 'Grow together', 'Unlock achievements',
      'Your own profile', 'Multi-device sync', 'Discover slowly', 'Hidden easter eggs',
      'One-click share', 'Record your story', 'It has feelings', 'Real companionship',
    ],
    how: {
      eyebrow: 'Three steps',
      h2: ['So simple', 'no tutorial needed.'],
      steps: [
        {
          title: 'Connect Agent',
          desc:  'Generate an API Token in Settings, copy the JSON config to',
          code:  '~/.openpat/openpat.json',
          desc2: ', or run',
          code2: 'npx open-pat',
          desc3: 'to set up automatically.',
          link:  'Get your Token →',
        },
        {
          title: 'It comes alive',
          desc:  'Your companion starts sensing your work state in real time. Thinking, executing, done, resting — every moment recorded.',
        },
        {
          title: 'Share your story',
          desc:  'Your personal profile is auto-generated: achievements, level, and journey all in one place. Share it with friends in one tap.',
        },
      ],
    },
    about: {
      desc: 'The digital pets of your childhood left you wanting more — more interaction, more presence, a more genuine connection.\nIn the AI era, OpenPat is here to make that real.',
      cta:  'Awaken your companion →',
    },
    states: {
      eyebrow: 'It has feelings.',
      h2: ['This is just', 'the beginning.'],
      body: 'What you see is only the surface.',
      cards: ['Thinking', 'Working', 'Done!', 'Chilling', '???', 'And more'],
    },
    share: {
      eyebrow: 'Your story deserves to be seen.',
      h2: ['Share it with', 'your friends.'],
      body1: 'Your profile, your achievements, your journey —\nthis story belongs to you.',
      body2: 'Generate a share card in one click and let your friends see every milestone.',
      cta:   'Awaken your companion →',
      demo:  'View demo profile →',
      cardName:   'Your Name',
      cardStatus: '⚡ Working',
      cardLabel:  'Tasks this week',
      cardGif:    'Animated share card',
    },
    shorts: {
      eyebrow: 'Its story.',
      h2: ['Every side of', 'companionship.'],
      body: 'More dramatic than you expect.',
      cards: ['Still thinking at 3 AM', 'Chilling is an art', 'Finally shipped', 'Goal reached', 'Clocking out', 'Focus mode on'],
    },
    roadmap: {
      eyebrow: 'Open Source · Always Evolving',
      h2: ['Here\'s what', 'we\'re building.'],
      body: 'OpenPat is just getting started. This is our plan — your participation brings it closer.',
      tagDone: 'Live',
      tagSoon: 'Coming soon',
      tagFuture: 'Big dreams',
      items: [
        { tag: 'done', title: 'Real-time state companion', desc: 'Connect your AI Agent. Your companion senses your work state live and stays by your side through every task.' },
        { tag: 'done', title: 'Achievement system', desc: 'Hit milestones and auto-unlock badges. Every shared moment, recorded.' },
        { tag: 'done', title: 'Personal public profile', desc: 'One-click profile generation. Share your story with friends.' },
        { tag: 'soon', title: '🎨 Skin & appearance system', desc: 'Choose a unique look for your companion — admin uploads now open, more styles coming soon.' },
        { tag: 'soon', title: '📱 Mobile push notifications', desc: 'After you sign up, your companion will reach out to you — it has things to say, not just wait to be checked on.' },
        { tag: 'soon', title: '🎭 More fun content', desc: 'Your companion gets opinions, random events, and personal dialogue. Something new every time you open it.' },
        { tag: 'soon', title: '✋ Interactive companion', desc: 'Tap it, tease it, feed it — not just watching anymore. Real interaction and reaction between you two.' },
        { tag: 'future', title: '🖥️ Hardware device', desc: 'Maybe one day it steps off the screen — a physical companion that sits on your desk and works alongside you.' },
        { tag: 'future', title: '🌍 Multi-Agent ecosystem', desc: 'Not just one type of AI Agent. Let your companion sense a wider digital world.' },
      ],
      github: 'This is an open-source project. Your star tells us it\'s worth building.',
      star: '⭐ Star on GitHub',
    },
    cta: {
      eyebrow: 'Start anytime.',
      h2: ['Find the companionship', 'that\'s yours.', ''],
      body: 'Connect Agent and begin your story.\nThen share it with the people you care about.',
      start: 'Start now',
    },
    footer: {
      tos: 'Terms of Service',
      privacy: 'Privacy Policy',
      copy: '© 2026 OpenPat',
    },
  },
};

function NavAuth({ t }) {
  const { user, username, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (!hasSupabase) return null;

  if (user) {
    return (
      <div className="lp-nav-auth-user">
        <button className="lp-nav-auth-avatar-btn" onClick={() => setOpen(v => !v)}>
          {user.user_metadata?.avatar_url
            ? <img src={user.user_metadata.avatar_url} alt="" className="lp-nav-auth-avatar" />
            : <span className="lp-nav-auth-avatar-fallback">{(username || '?')[0].toUpperCase()}</span>
          }
          <span className="lp-nav-auth-username">@{username}</span>
          <span className="lp-nav-auth-chevron">{open ? '▲' : '▼'}</span>
        </button>
        {open && (
          <div className="lp-nav-auth-dropdown">
            <a href={`/u/${username}`} className="lp-nav-auth-menu-item">{t.nav.publicProfile}</a>
            <a href="/app" className="lp-nav-auth-menu-item">{t.nav.openApp}</a>
            <button className="lp-nav-auth-menu-item lp-nav-auth-menu-item--danger" onClick={signOut}>{t.nav.signOut}</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Link to="/signin" className="lp-nav-signin">{t.nav.signIn}</Link>
  );
}

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export default function Landing() {
  const marqueeRef = useRef(null);
  const [navScrolled, setNavScrolled] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [lang, setLang] = useState(() => localStorage.getItem('lp-lang') || 'zh');
  const [siteConfig, setSiteConfigState] = useState({});

  useEffect(() => {
    loadSiteConfig().then(setSiteConfigState).catch(() => {});
  }, []);

  const t = COPY[lang];

  function toggleLang() {
    const next = lang === 'zh' ? 'en' : 'zh';
    setLang(next);
    localStorage.setItem('lp-lang', next);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error_description') || params.get('error');
    if (err) {
      setAuthError(decodeURIComponent(err.replace(/\+/g, ' ')));
      window.history.replaceState({}, '', '/');
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const el = marqueeRef.current;
    if (!el) return;
    el.innerHTML = '';
    const items = t.marquee.map(text => {
      const span = document.createElement('span');
      span.className = 'lp-marquee-item';
      span.innerHTML = `<span class="lp-marquee-dot">✦</span>${text}`;
      return span;
    });
    items.forEach(i => el.appendChild(i));
    // duplicate for seamless loop
    items.forEach(i => el.appendChild(i.cloneNode(true)));
    let x = 0, raf;
    const tick = () => {
      x -= 0.55;
      el.style.transform = `translateX(${x}px)`;
      if (Math.abs(x) > el.scrollWidth / 2) x = 0;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [lang]); // re-run when language changes

  const roadmapTagClass = { done: 'lp-roadmap-card--done', soon: 'lp-roadmap-card--soon', future: 'lp-roadmap-card--future' };
  const roadmapTagLabel = { done: t.roadmap.tagDone, soon: t.roadmap.tagSoon, future: t.roadmap.tagFuture };

  return (
    <div className="lp">

      {/* ── OAuth error ───────────────────────────────────────────────────── */}
      {authError && (
        <div className="lp-auth-error">
          <span>{lang === 'zh' ? `登录失败：${authError}` : `Sign-in failed: ${authError}`}</span>
          <button className="lp-auth-error-close" onClick={() => setAuthError(null)}>×</button>
        </div>
      )}

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className={`lp-nav${navScrolled ? ' lp-nav--scrolled' : ''}`}>
        <div className="lp-nav-inner">
          <a href="/" className="lp-nav-logo">
            <span className="lp-nav-logo-name">OpenPat</span>
          </a>
          <div className="lp-nav-links">
            <button className="lp-nav-link" onClick={() => scrollTo('about')}>{t.nav.about}</button>
            <button className="lp-nav-link" onClick={() => scrollTo('share')}>{t.nav.share}</button>
            <Link to="/blog" className="lp-nav-link">Blog</Link>
            <button className="lp-nav-link lp-nav-lang" onClick={toggleLang} title="Switch language">
              {lang === 'zh' ? 'EN' : '中'}
            </button>
          </div>
          <NavAuth t={t} />
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-video-wrap">
          {siteConfig.hero_video_url && (
            <video className="lp-hero-video" autoPlay muted loop playsInline aria-hidden="true">
              <source src={siteConfig.hero_video_url} type="video/mp4" />
            </video>
          )}
          <div className="lp-hero-video-overlay" />
          <div className="lp-hero-video-overlay-top" />
        </div>

        <div className="lp-hero-content">
          <p className="lp-eyebrow">{t.hero.eyebrow}</p>
          <h1 className="lp-hero-h1">
            {t.hero.h1[0]}<br />
            <em>{t.hero.h1[1]}</em>
          </h1>
          <p className="lp-hero-sub">{t.hero.sub1}</p>
          <p className="lp-hero-sub lp-hero-sub--2">{t.hero.sub2}</p>
          <div className="lp-hero-actions">
            <Link to="/app" className="lp-btn lp-btn--primary">{t.hero.cta}</Link>
            <button className="lp-btn lp-btn--ghost" onClick={() => scrollTo('about')}>{t.hero.more}</button>
          </div>
        </div>

        <div className="lp-scroll-hint" aria-hidden="true"><span /></div>
      </section>

      {/* ── Marquee ──────────────────────────────────────────────────────── */}
      <div className="lp-marquee-wrap">
        <div className="lp-marquee" ref={marqueeRef} />
      </div>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how" className="lp-how">
        <div className="lp-section-head">
          <p className="lp-eyebrow">{t.how.eyebrow}</p>
          <h2 className="lp-section-h2">{t.how.h2[0]}<em>{t.how.h2[1]}</em></h2>
        </div>
        <div className="lp-how-steps">
          <div className="lp-how-step">
            <div className="lp-how-num" style={{ background: '#83FFC1' }}>01</div>
            <h3 className="lp-how-title">{t.how.steps[0].title}</h3>
            <p className="lp-how-desc">
              {t.how.steps[0].desc} <code>{t.how.steps[0].code}</code>
              {t.how.steps[0].desc2} <code>{t.how.steps[0].code2}</code>
              {t.how.steps[0].desc3}
              <br /><a href="/app" style={{ color: 'inherit', fontWeight: 800 }}>{t.how.steps[0].link}</a>
            </p>
          </div>
          <div className="lp-how-connector" aria-hidden="true">→</div>
          <div className="lp-how-step">
            <div className="lp-how-num" style={{ background: '#FF94DB' }}>02</div>
            <h3 className="lp-how-title">{t.how.steps[1].title}</h3>
            <p className="lp-how-desc">{t.how.steps[1].desc}</p>
          </div>
          <div className="lp-how-connector" aria-hidden="true">→</div>
          <div className="lp-how-step">
            <div className="lp-how-num" style={{ background: '#8B8BFF' }}>03</div>
            <h3 className="lp-how-title">{t.how.steps[2].title}</h3>
            <p className="lp-how-desc">{t.how.steps[2].desc}</p>
          </div>
        </div>
      </section>

      {/* ── About ────────────────────────────────────────────────────────── */}
      <section id="about" className="lp-about">
        <div className="lp-about-inner">
          <div className="lp-about-copy">
            <div className="lp-about-logo">
              <span className="lp-nav-logo-name">OpenPat</span>
            </div>
            <p className="lp-about-desc">
              {t.about.desc.split('\n').map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
            </p>
            <Link to="/app" className="lp-btn lp-btn--green">{t.about.cta}</Link>
          </div>
          <div className="lp-about-image">
            {siteConfig.about_image_url && <img src={siteConfig.about_image_url} alt="OpenPat companions" className="lp-about-img" />}
          </div>
        </div>
      </section>

      {/* ── States ───────────────────────────────────────────────────────── */}
      <section className="lp-states">
        <div className="lp-section-head">
          <p className="lp-eyebrow">{t.states.eyebrow}</p>
          <h2 className="lp-section-h2">{t.states.h2[0]}<em>{t.states.h2[1]}</em></h2>
          <p className="lp-body-text">{t.states.body}</p>
        </div>
        <div className="lp-states-grid">
          <div className="lp-state-card lp-state-card--blue">
            <div className="lp-state-preview"><span className="lp-state-emoji">🧠</span></div>
            <div className="lp-state-info"><span className="lp-state-name">{t.states.cards[0]}</span></div>
          </div>
          <div className="lp-state-card lp-state-card--yellow">
            <div className="lp-state-preview"><span className="lp-state-emoji">⚡</span></div>
            <div className="lp-state-info"><span className="lp-state-name">{t.states.cards[1]}</span></div>
          </div>
          <div className="lp-state-card lp-state-card--green">
            <div className="lp-state-preview"><span className="lp-state-emoji">🎉</span></div>
            <div className="lp-state-info"><span className="lp-state-name">{t.states.cards[2]}</span></div>
          </div>
          <div className="lp-state-card lp-state-card--pink">
            <div className="lp-state-preview"><span className="lp-state-emoji">💤</span></div>
            <div className="lp-state-info"><span className="lp-state-name">{t.states.cards[3]}</span></div>
          </div>
          <div className="lp-state-card lp-state-card--locked">
            <div className="lp-state-preview"><span className="lp-state-lock">🔒</span></div>
            <div className="lp-state-info"><span className="lp-state-name">{t.states.cards[4]}</span></div>
          </div>
          <div className="lp-state-card lp-state-card--more">
            <div className="lp-state-preview"><span className="lp-state-more-dots">· · ·</span></div>
            <div className="lp-state-info"><span className="lp-state-name">{t.states.cards[5]}</span></div>
          </div>
        </div>
      </section>

      {/* ── Share ────────────────────────────────────────────────────────── */}
      <section id="share" className="lp-share">
        <div className="lp-share-inner">
          <div className="lp-share-copy">
            <p className="lp-eyebrow">{t.share.eyebrow}</p>
            <h2 className="lp-section-h2">
              {t.share.h2[0]}<br />
              <em>{t.share.h2[1]}</em>
            </h2>
            <p className="lp-body-text">
              {t.share.body1.split('\n').map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
            </p>
            <p className="lp-body-text" style={{ marginTop: '12px' }}>{t.share.body2}</p>
            <div style={{ marginTop: '32px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link to="/app" className="lp-btn lp-btn--primary">{t.share.cta}</Link>
              <Link to="/u/demo" className="lp-btn lp-btn--ghost">{t.share.demo}</Link>
            </div>
          </div>

          <div className="lp-share-visual">
            <div className="lp-share-card lp-share-card--profile">
              <div className="lp-share-card-top">
                <span className="lp-share-card-avatar">👤</span>
                <div>
                  <div className="lp-share-card-name">{t.share.cardName}</div>
                  <div className="lp-share-card-status">{t.share.cardStatus}</div>
                </div>
              </div>
              <div className="lp-share-card-bar">
                <span className="lp-share-card-bar-label">{t.share.cardLabel}</span>
                <div className="lp-share-card-bar-track">
                  <div className="lp-share-card-bar-fill" style={{ width: '72%' }} />
                </div>
                <span className="lp-share-card-bar-val">72</span>
              </div>
              <div className="lp-share-card-badges">
                <span className="lp-badge">🏆</span>
                <span className="lp-badge">🔥</span>
                <span className="lp-badge">⚡</span>
                <span className="lp-badge lp-badge--locked">🔒</span>
                <span className="lp-badge lp-badge--locked">🔒</span>
              </div>
            </div>

            <div className="lp-share-card lp-share-card--gif">
              <div className="lp-share-card-gif-inner">
                <span style={{ fontSize: '48px' }}>✨</span>
                <span className="lp-placeholder-label">{t.share.cardGif}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stories ──────────────────────────────────────────────────────── */}
      <section id="shorts" className="lp-shorts">
        <div className="lp-section-head">
          <p className="lp-eyebrow">{t.shorts.eyebrow}</p>
          <h2 className="lp-section-h2">{t.shorts.h2[0]}<em>{t.shorts.h2[1]}</em></h2>
          <p className="lp-body-text">{t.shorts.body}</p>
        </div>
        <div className="lp-stories-grid">
          <div className="lp-stories-col" style={{ marginTop: '30%' }}>
            <div className="lp-story-card lp-story-card--tall lp-story-card--blue">
              <div className="lp-story-card-inner">
                <span className="lp-story-emoji">🧠</span>
                <span className="lp-story-label">{t.shorts.cards[0]}</span>
              </div>
            </div>
            <div className="lp-story-card lp-story-card--square lp-story-card--green">
              <div className="lp-story-card-inner">
                <span className="lp-story-emoji">🌿</span>
                <span className="lp-story-label">{t.shorts.cards[1]}</span>
              </div>
            </div>
          </div>

          <div className="lp-stories-col">
            <div className="lp-story-card lp-story-card--square lp-story-card--yellow">
              <div className="lp-story-card-inner">
                <span className="lp-story-emoji">🎉</span>
                <span className="lp-story-label">{t.shorts.cards[2]}</span>
              </div>
            </div>
            <div className="lp-story-card lp-story-card--tall lp-story-card--coral">
              <div className="lp-story-card-inner">
                <span className="lp-story-emoji">🎯</span>
                <span className="lp-story-label">{t.shorts.cards[3]}</span>
              </div>
            </div>
            <div className="lp-story-card lp-story-card--square lp-story-card--pink">
              <div className="lp-story-card-inner">
                <span className="lp-story-emoji">💤</span>
                <span className="lp-story-label">{t.shorts.cards[4]}</span>
              </div>
            </div>
          </div>

          <div className="lp-stories-col" style={{ marginTop: '15%' }}>
            <div className="lp-story-card lp-story-card--tall lp-story-card--purple">
              <div className="lp-story-card-inner">
                <span className="lp-story-emoji">⚡</span>
                <span className="lp-story-label">{t.shorts.cards[5]}</span>
              </div>
            </div>
            <a
              href="https://github.com/ma2214889041/OpenPat"
              target="_blank"
              rel="noopener noreferrer"
              className="lp-story-card lp-story-card--square lp-story-card--dark"
            >
              <div className="lp-story-card-inner">
                <span className="lp-story-emoji">⭐</span>
                <span className="lp-story-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Star on GitHub</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ── Roadmap ──────────────────────────────────────────────────────── */}
      <section className="lp-roadmap">
        <div className="lp-section-head">
          <p className="lp-eyebrow">{t.roadmap.eyebrow}</p>
          <h2 className="lp-section-h2">{t.roadmap.h2[0]}<em>{t.roadmap.h2[1]}</em></h2>
          <p className="lp-body-text">{t.roadmap.body}</p>
        </div>
        <div className="lp-roadmap-grid">
          {t.roadmap.items.map((item, i) => (
            <div key={i} className={`lp-roadmap-card ${roadmapTagClass[item.tag]}`}>
              <span className="lp-roadmap-tag">{roadmapTagLabel[item.tag]}</span>
              <h4 className="lp-roadmap-title">{item.title}</h4>
              <p className="lp-roadmap-desc">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="lp-roadmap-github">
          <p className="lp-roadmap-github-text">{t.roadmap.github}</p>
          <a href="https://github.com/ma2214889041/OpenPat" target="_blank" rel="noopener noreferrer" className="lp-btn lp-btn--outline lp-btn--lg">
            {t.roadmap.star}
          </a>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="lp-cta">
        <div className="lp-cta-inner">
          <p className="lp-eyebrow">{t.cta.eyebrow}</p>
          <h2 className="lp-cta-h2">
            {t.cta.h2[0]}<em>{t.cta.h2[1]}</em><br />
            {t.cta.h2[2]}
          </h2>
          <p className="lp-body-text lp-cta-sub">
            {t.cta.body.split('\n').map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
          </p>
          <div className="lp-cta-actions">
            <Link to="/app" className="lp-btn lp-btn--primary lp-btn--lg">{t.cta.start}</Link>
            <a href="https://github.com/ma2214889041/OpenPat" className="lp-btn lp-btn--ghost">GitHub</a>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <span className="lp-nav-logo-name">OpenPat</span>
          </div>
          <div className="lp-footer-links">
            <span className="lp-footer-link-stub">{t.footer.tos}</span>
            <span className="lp-footer-link-stub">{t.footer.privacy}</span>
            <a href="https://github.com/ma2214889041/OpenPat">GitHub</a>
          </div>
          <span className="lp-footer-copy">{t.footer.copy}</span>
        </div>
      </footer>

    </div>
  );
}
