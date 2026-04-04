import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { hasSupabase } from '../utils/supabase';
// Site config loaded from KV via API
async function loadSiteConfig() {
  try {
    const res = await fetch('/api/site-config');
    return res.ok ? await res.json() : {};
  } catch { return {}; }
}
import './Landing.css';

// ── Bilingual copy ────────────────────────────────────────────────────────────
const COPY = {
  zh: {
    nav: {
      about:    '关于',
      share:    '博客',
      feedback: '反馈',
      publicProfile: '🌐 我的主页',
      openApp:  '开始聊天',
      signOut:  '退出登录',
      signIn:   '登录 / 注册',
    },
    hero: {
      eyebrow: '有记忆的 AI 伴侣',
      h1:      ['一个真正记得你的', 'AI。'],
      sub1:    '不是助手，是伙伴。',
      sub2:    '拍拍会记住你说过的每一件重要的事，理解你的偏好和情绪，在你需要的时候帮你搜索、提醒、解决问题。',
      cta:     '开始聊天 →',
      more:    '了解更多 ↓',
    },
    marquee: [
      '记住你', '理解你', '帮你搜索', '设置提醒',
      '查天气', '越来越懂你', '有自己的性格', '真实陪伴',
      '不敷衍', '有记忆', '跨对话记忆', '情绪感知',
    ],
    how: {
      eyebrow: '很简单',
      h2: ['注册，', '然后聊天。'],
      steps: [
        {
          title: '登录',
          desc:  '用 GitHub 或 Google 账号一键登录。',
        },
        {
          title: '开始聊天',
          desc:  '跟拍拍说任何事。它会记住重要的信息，下次聊天时自然地引用。',
        },
        {
          title: '它越来越懂你',
          desc:  '聊得越多，拍拍对你的了解越深。它知道你的偏好、习惯、最近的心情。',
        },
      ],
    },
    about: {
      desc: '市面上的 AI 每次对话都从零开始。\n拍拍不一样——它记得你是谁，记得你说过什么，记得你在意什么。',
      cta:  '开始聊天 →',
    },
    states: {
      eyebrow: '它能做什么。',
      h2: ['不只是', '聊天。'],
      body: '拍拍有真正的能力。',
      cards: ['搜索互联网', '查天气', '设提醒', '记住你', '理解情绪', '解决问题'],
    },
    share: {
      eyebrow: '越聊越懂你。',
      h2: ['持久的', '记忆。'],
      body1: '拍拍会自动从对话中提取重要信息，\n形成对你的长期了解。',
      body2: '你可以随时查看和管理拍拍记住的一切。你的数据，你做主。',
      cta:   '开始聊天 →',
      demo:  '了解记忆系统 →',
      cardName:   '你的名字',
      cardStatus: '💬 聊天中',
      cardLabel:  '拍拍记住了',
      cardGif:    '记忆面板',
    },
    shorts: {
      eyebrow: '不同的关系阶段。',
      h2: ['从陌生人', '到老朋友。'],
      body: '关系会成长。',
      cards: ['刚认识', '开始熟悉', '可以开玩笑', '深度理解', '知己', '默契'],
    },
    roadmap: {
      eyebrow: '开源 · 持续进化',
      h2: ['我们正在', '构建什么。'],
      body: 'OpenPat 刚刚开始。你的参与会让它更快到来。',
      tagDone: '已上线',
      tagSoon: '即将推出',
      tagFuture: '大胆设想',
      items: [
        { tag: 'done', title: '智能对话', desc: '基于 Gemini，能搜索、查天气、设提醒，不只是聊天。' },
        { tag: 'done', title: '持久记忆', desc: '自动从对话中提取重要信息，跨对话长期记忆。' },
        { tag: 'done', title: '情绪感知', desc: '感知你的情绪状态，调整回应方式。' },
        { tag: 'done', title: '关系成长', desc: '从陌生人到知己，聊得越多关系越深。' },
        { tag: 'soon', title: '📱 移动端 App', desc: '随时随地跟拍拍聊天，不只在浏览器里。' },
        { tag: 'soon', title: '🎨 自定义角色', desc: '选择你喜欢的伙伴形象——可爱动物、动漫角色、或者其他。' },
        { tag: 'soon', title: '🔔 主动联系', desc: '拍拍会在合适的时候主动找你——提醒、问候、或者只是想聊聊。' },
        { tag: 'future', title: '🧠 更强的智力', desc: '接入更多工具，帮你管理日程、读文件、做更复杂的事。' },
        { tag: 'future', title: '🌍 多平台', desc: '桌面端、手机端、浏览器插件——在每个场景陪伴你。' },
      ],
      github: '这是一个开源项目。你的 Star 让我们知道它值得被做。',
      star: '⭐ Star on GitHub',
    },
    cta: {
      eyebrow: '随时开始。',
      h2: ['找一个', '真正记得你的', '伙伴。'],
      body: '注册，然后开始聊天。\n拍拍会做剩下的事——记住你、理解你、陪伴你。',
      start: '开始聊天',
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
      share:    'Blog',
      feedback: 'Feedback',
      publicProfile: '🌐 My Profile',
      openApp:  'Start Chatting',
      signOut:  'Sign Out',
      signIn:   'Sign In / Sign Up',
    },
    hero: {
      eyebrow: 'AI Companion with Memory',
      h1:      ['An AI that actually', 'remembers you.'],
      sub1:    'Not an assistant. A companion.',
      sub2:    'Pat remembers everything important you share, understands your preferences and emotions, and helps with search, reminders, and real problems when you need it.',
      cta:     'Start chatting →',
      more:    'Learn more ↓',
    },
    marquee: [
      'Remembers you', 'Understands you', 'Web search', 'Set reminders',
      'Check weather', 'Learns over time', 'Has personality', 'Real companionship',
      'Never shallow', 'Persistent memory', 'Cross-session', 'Emotion aware',
    ],
    how: {
      eyebrow: 'Simple',
      h2: ['Sign up,', 'then chat.'],
      steps: [
        {
          title: 'Sign in',
          desc:  'One-click sign in with GitHub or Google.',
        },
        {
          title: 'Start chatting',
          desc:  'Tell Pat anything. It remembers what matters and naturally references it in future conversations.',
        },
        {
          title: 'It gets to know you',
          desc:  'The more you chat, the deeper Pat understands you. Your preferences, habits, recent mood — all remembered.',
        },
      ],
    },
    about: {
      desc: 'Every AI out there starts from scratch each conversation.\nPat is different — it remembers who you are, what you said, and what you care about.',
      cta:  'Start chatting →',
    },
    states: {
      eyebrow: 'What it can do.',
      h2: ['More than', 'just chat.'],
      body: 'Pat has real capabilities.',
      cards: ['Web search', 'Weather', 'Reminders', 'Memory', 'Emotion aware', 'Problem solving'],
    },
    share: {
      eyebrow: 'The more you chat, the more it knows.',
      h2: ['Persistent', 'memory.'],
      body1: 'Pat automatically extracts important information from your conversations\nand builds a long-term understanding of you.',
      body2: 'You can view and manage everything Pat remembers. Your data, your control.',
      cta:   'Start chatting →',
      demo:  'Learn about memory →',
      cardName:   'Your Name',
      cardStatus: '💬 Chatting',
      cardLabel:  'Pat remembers',
      cardGif:    'Memory panel',
    },
    shorts: {
      eyebrow: 'Relationship stages.',
      h2: ['From stranger', 'to confidant.'],
      body: 'The relationship grows.',
      cards: ['Just met', 'Getting familiar', 'Can joke around', 'Deep understanding', 'Confidant', 'In sync'],
    },
    roadmap: {
      eyebrow: 'Open Source · Always Evolving',
      h2: ['What we\'re', 'building.'],
      body: 'OpenPat is just getting started. Your participation brings it closer.',
      tagDone: 'Live',
      tagSoon: 'Coming soon',
      tagFuture: 'Big dreams',
      items: [
        { tag: 'done', title: 'Smart conversation', desc: 'Powered by Gemini. Can search, check weather, set reminders — not just chat.' },
        { tag: 'done', title: 'Persistent memory', desc: 'Automatically extracts important info from conversations. Long-term cross-session memory.' },
        { tag: 'done', title: 'Emotion awareness', desc: 'Senses your emotional state and adjusts responses accordingly.' },
        { tag: 'done', title: 'Relationship growth', desc: 'From stranger to confidant. The more you chat, the deeper the bond.' },
        { tag: 'soon', title: '📱 Mobile app', desc: 'Chat with Pat anytime, anywhere — not just in the browser.' },
        { tag: 'soon', title: '🎨 Custom characters', desc: 'Choose your companion\'s look — cute animals, anime, or something else entirely.' },
        { tag: 'soon', title: '🔔 Proactive outreach', desc: 'Pat reaches out when it makes sense — reminders, check-ins, or just to chat.' },
        { tag: 'future', title: '🧠 Stronger intelligence', desc: 'More tools: calendar, file reading, complex task handling.' },
        { tag: 'future', title: '🌍 Multi-platform', desc: 'Desktop, mobile, browser extension — with you everywhere.' },
      ],
      github: 'This is an open-source project. Your star tells us it\'s worth building.',
      star: '⭐ Star on GitHub',
    },
    cta: {
      eyebrow: 'Start anytime.',
      h2: ['Find a companion', 'that remembers you.', ''],
      body: 'Sign up and start chatting.\nPat does the rest — remembering, understanding, being there.',
      start: 'Start chatting',
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
            <a href="/chat" className="lp-nav-auth-menu-item">{t.nav.openApp}</a>
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
  const [mobileMenu, setMobileMenu] = useState(false);

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
            <Link to="/blog" className="lp-nav-link">{t.nav.share}</Link>
            <button className="lp-nav-link lp-nav-lang" onClick={toggleLang} title="Switch language">
              {lang === 'zh' ? 'EN' : '中'}
            </button>
          </div>
          <div className="lp-nav-auth-desktop"><NavAuth t={t} /></div>
          <button className="lp-nav-burger" onClick={() => setMobileMenu(v => !v)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
        {mobileMenu && (
          <div className="lp-mobile-menu">
            <button className="lp-mobile-link" onClick={() => { scrollTo('about'); setMobileMenu(false); }}>{t.nav.about}</button>
            <Link to="/blog" className="lp-mobile-link" onClick={() => setMobileMenu(false)}>{t.nav.share}</Link>
            <button className="lp-mobile-link" onClick={() => { toggleLang(); setMobileMenu(false); }}>
              {lang === 'zh' ? 'EN' : '中'}
            </button>
            <div className="lp-mobile-auth">
              <NavAuth t={t} />
            </div>
          </div>
        )}
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
            <Link to="/chat" className="lp-btn lp-btn--primary">{t.hero.cta}</Link>
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
              <br /><a href="/chat" style={{ color: 'inherit', fontWeight: 800 }}>{t.how.steps[0].link}</a>
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
            <Link to="/chat" className="lp-btn lp-btn--green">{t.about.cta}</Link>
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
              <Link to="/chat" className="lp-btn lp-btn--primary">{t.share.cta}</Link>
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
            <Link to="/chat" className="lp-btn lp-btn--primary lp-btn--lg">{t.cta.start}</Link>
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
