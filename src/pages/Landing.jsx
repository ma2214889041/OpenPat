import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { hasSupabase } from '../utils/supabase';
import './Landing.css';

// Site config loaded from KV via API
async function loadSiteConfig() {
  try {
    const res = await fetch('/api/site-config');
    return res.ok ? await res.json() : {};
  } catch { return {}; }
}

// ── Bilingual copy ──────────────────────────────────────────────────────────
const COPY = {
  zh: {
    nav: {
      about: '关于',
      blog: '博客',
      openApp: '开始聊天',
      signOut: '退出',
      signIn: '登录',
    },
    hero: {
      eyebrow: '有记忆的 AI 伴侣',
      h1:      ['一个真正记得你的', 'AI。'],
      sub1:    '不是助手，是伙伴。',
      sub2:    '拍拍会记住你说过的每一件重要的事，理解你的偏好和情绪，在你需要的时候帮你搜索、查天气、解决问题。',
      cta:     '开始聊天 →',
      more:    '了解更多 ↓',
    },
    marquee: [
      '记住你', '理解你', '帮你搜索', '主动关心你',
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
    craft: {
      eyebrow: '人格与记忆',
      h2: '温暖、自然，',
      h2em: '不假装是人。',
      body: '通过人格设计、记忆系统和情感理解，我们创造了一个感觉真实的体验——它会倾听、会回应、会记住你，也知道什么时候该退后一步。',
    },
    states: {
      eyebrow: '它能做什么。',
      h2: ['不只是', '聊天。'],
      body: '拍拍有真正的能力。',
      cards: ['搜索互联网', '查天气', '主动关心', '记住你', '理解情绪', '解决问题'],
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
        { tag: 'done', title: '智能对话', desc: '基于 Gemini，能搜索、查天气、主动关心你，不只是聊天。' },
        { tag: 'done', title: '持久记忆', desc: '自动从对话中提取重要信息，跨对话长期记忆。' },
        { tag: 'done', title: '情绪感知', desc: '感知你的情绪状态，调整回应方式。' },
        { tag: 'done', title: '关系成长', desc: '从陌生人到知己，聊得越多关系越深。' },
        { tag: 'soon', title: '📱 移动端 App', desc: '随时随地跟拍拍聊天，不只在浏览器里。' },
        { tag: 'soon', title: '🎨 自定义角色', desc: '选择你喜欢的伙伴形象——可爱动物、动漫角色、或者其他。' },
        { tag: 'soon', title: '🔔 主动联系', desc: '拍拍会在合适的时候主动找你——跟进、问候、或者只是想聊聊。' },
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
      about: 'About',
      blog: 'Blog',
      openApp: 'Start Chatting',
      signOut: 'Sign Out',
      signIn: 'Sign In',
    },
    hero: {
      eyebrow: 'AI Companion with Memory',
      h1:      ['An AI that actually', 'remembers you.'],
      sub1:    'Not an assistant. A companion.',
      sub2:    'Pat remembers everything important you share, understands your preferences and emotions, and helps with search, weather, and real problems when you need it.',
      cta:     'Start chatting →',
      more:    'Learn more ↓',
    },
    marquee: [
      'Remembers you', 'Understands you', 'Web search', 'Proactive care',
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
    craft: {
      eyebrow: 'Character & memory',
      h2: 'Warm, natural, ',
      h2em: 'not pretending to be human.',
      body: 'Through character design, memory systems, and emotional understanding, we\'ve created an experience that feels real — it listens, responds, remembers you, and knows when to step back.',
    },
    states: {
      eyebrow: 'What it can do.',
      h2: ['More than', 'just chat.'],
      body: 'Pat has real capabilities.',
      cards: ['Web search', 'Weather', 'Proactive care', 'Memory', 'Emotion aware', 'Problem solving'],
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
        { tag: 'done', title: 'Smart conversation', desc: 'Powered by Gemini. Can search, check weather, proactively follow up — not just chat.' },
        { tag: 'done', title: 'Persistent memory', desc: 'Automatically extracts important info from conversations. Long-term cross-session memory.' },
        { tag: 'done', title: 'Emotion awareness', desc: 'Senses your emotional state and adjusts responses accordingly.' },
        { tag: 'done', title: 'Relationship growth', desc: 'From stranger to confidant. The more you chat, the deeper the bond.' },
        { tag: 'soon', title: '📱 Mobile app', desc: 'Chat with Pat anytime, anywhere — not just in the browser.' },
        { tag: 'soon', title: '🎨 Custom characters', desc: 'Choose your companion\'s look — cute animals, anime, or something else entirely.' },
        { tag: 'soon', title: '🔔 Proactive outreach', desc: 'Pat reaches out when it makes sense — follow-ups, check-ins, or just to chat.' },
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

// ── Nav auth component ──────────────────────────────────────────────────────
function NavAuth({ t }) {
  const { user, username, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (!hasSupabase) return null;

  if (user) {
    return (
      <div className="lp-nav-user">
        <button className="lp-nav-avatar-btn" onClick={() => setOpen(v => !v)}>
          {user.user_metadata?.avatar_url
            ? <img src={user.user_metadata.avatar_url} alt="" className="lp-nav-avatar" />
            : <span className="lp-nav-avatar-fallback">{(username || '?')[0].toUpperCase()}</span>}
          <span className="lp-nav-username">@{username}</span>
        </button>
        {open && (
          <div className="lp-nav-dropdown">
            <a href={`/u/${username}`} className="lp-nav-dropdown-item">Profile</a>
            <a href="/chat" className="lp-nav-dropdown-item">{t.nav.openApp}</a>
            <button className="lp-nav-dropdown-item lp-nav-dropdown-item--danger" onClick={signOut}>{t.nav.signOut}</button>
          </div>
        )}
      </div>
    );
  }

  return <Link to="/signin" className="lp-nav-signin-btn">{t.nav.signIn}</Link>;
}

// ── Scroll-reveal hook ──────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('revealed'); obs.unobserve(el); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, className = '', delay = 0 }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`reveal ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function Landing() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [lang, setLang] = useState(() => localStorage.getItem('lp-lang') || 'zh');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [siteConfig, setSiteConfig] = useState({});

  useEffect(() => { loadSiteConfig().then(setSiteConfig).catch(() => {}); }, []);

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
    const onScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="lp">

      {/* ── Auth error ────────────────────────────────────────── */}
      {authError && (
        <div className="lp-auth-error">
          <span>{lang === 'zh' ? `登录失败：${authError}` : `Sign-in failed: ${authError}`}</span>
          <button onClick={() => setAuthError(null)}>×</button>
        </div>
      )}

      {/* ── Nav ───────────────────────────────────────────────── */}
      <nav className={`lp-nav${navScrolled ? ' lp-nav--scrolled' : ''}`}>
        <div className="lp-nav-inner">
          <a href="/" className="lp-logo">OpenPat</a>
          <div className="lp-nav-links">
            <button className="lp-nav-link" onClick={() => scrollTo('about')}>{t.nav.about}</button>
            <Link to="/blog" className="lp-nav-link">{t.nav.blog}</Link>
            <button className="lp-nav-link lp-nav-lang" onClick={toggleLang}>
              {lang === 'zh' ? 'EN' : '中'}
            </button>
            <div className="lp-nav-auth-area"><NavAuth t={t} /></div>
          </div>
          <button className="lp-nav-burger" onClick={() => setMobileMenu(v => !v)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
        {mobileMenu && (
          <div className="lp-mobile-menu">
            <button onClick={() => { scrollTo('about'); setMobileMenu(false); }}>{t.nav.about}</button>
            <Link to="/blog" onClick={() => setMobileMenu(false)}>{t.nav.blog}</Link>
            <button onClick={() => { toggleLang(); setMobileMenu(false); }}>{lang === 'zh' ? 'EN' : '中'}</button>
            <NavAuth t={t} />
          </div>
        )}
      </nav>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className={`lp-hero${siteConfig.hero_video_url ? '' : ' lp-hero--no-video'}`}>
        {/* Full-screen background video */}
        <div className="lp-hero-bg">
          {siteConfig.hero_video_url && (
            <video className="lp-hero-video" autoPlay muted loop playsInline>
              <source src={siteConfig.hero_video_url} type="video/mp4" />
            </video>
          )}
          <div className="lp-hero-overlay" />
        </div>

        <div className="lp-hero-inner">
          <div className="lp-hero-content">
            <h1 className="lp-hero-h1">
              {t.hero.h1[0]}<br />
              <span className="lp-hero-h1-em">{t.hero.h1[1]}</span>
            </h1>
            <p className="lp-hero-sub">{t.hero.sub}</p>
            <div className="lp-hero-actions">
              <Link to="/chat" className="lp-btn lp-btn--hero">{t.hero.cta}</Link>
              <button className="lp-btn lp-btn--hero-ghost" onClick={() => scrollTo('about')}>{t.hero.secondary}</button>
            </div>
          </div>

          {/* Creature shown alongside text when no video */}
          {!siteConfig.hero_video_url && (
            <div className="lp-hero-visual">
              <div className="lp-creature">
                <div className="lp-creature-body">
                  <div className="lp-creature-face">
                    <div className="lp-creature-eye lp-creature-eye--l"><div className="lp-creature-pupil" /></div>
                    <div className="lp-creature-eye lp-creature-eye--r"><div className="lp-creature-pupil" /></div>
                    <div className="lp-creature-mouth" />
                  </div>
                  <div className="lp-creature-cheek lp-creature-cheek--l" />
                  <div className="lp-creature-cheek lp-creature-cheek--r" />
                </div>
                <div className="lp-creature-shadow" />
              </div>
            </div>
          )}
        </div>

        <div className="lp-scroll-hint" aria-hidden="true"><span /></div>
      </section>

      {/* ── Mission ──────────────────────────────────────────── */}
      <section id="about" className="lp-section">
        <Reveal>
          <p className="lp-eyebrow">{t.mission.eyebrow}</p>
          <h2 className="lp-h2">{t.mission.h2}<br /><span className="lp-h2-em">{t.mission.h2em}</span></h2>
          <p className="lp-body">{t.mission.body}</p>
        </Reveal>
      </section>

      {/* ── Craft ─────────────────────────────────────────────── */}
      <section className="lp-section">
        <Reveal>
          <p className="lp-eyebrow">{t.craft.eyebrow}</p>
          <h2 className="lp-h2">{t.craft.h2}<span className="lp-h2-em">{t.craft.h2em}</span></h2>
          <p className="lp-body">{t.craft.body}</p>
        </Reveal>
      </section>

      {/* ── Open source CTA ───────────────────────────────────── */}
      <section className="lp-section lp-opensource">
        <Reveal>
          <p className="lp-eyebrow">{t.opensource.eyebrow}</p>
          <h2 className="lp-h2">{t.opensource.h2}<span className="lp-h2-em">{t.opensource.h2em}</span></h2>
          <p className="lp-body">{t.opensource.body}</p>
          <div className="lp-opensource-actions">
            <a
              href="https://github.com/ma2214889041/OpenPat"
              target="_blank"
              rel="noopener noreferrer"
              className="lp-btn lp-btn--outline"
            >{t.opensource.star}</a>
            <Link to="/chat" className="lp-btn lp-btn--primary">{t.opensource.chat}</Link>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <a href="/" className="lp-logo">OpenPat</a>
          <div className="lp-footer-links">
            <span>{t.footer.tos}</span>
            <span>{t.footer.privacy}</span>
            <a href="https://github.com/ma2214889041/OpenPat" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
          <span className="lp-footer-copy">{t.footer.copy}</span>
        </div>
      </footer>

    </div>
  );
}
