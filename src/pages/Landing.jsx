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
      h1: ['懂你的', '小伙伴。'],
      sub: '不是工具，不是助手。是一个会记住你、理解你、陪你成长的伙伴。',
      cta: '开始聊天',
      secondary: '了解更多',
    },
    stats: [
      { value: '开源', label: '完全免费' },
      { value: '∞', label: '持久记忆' },
      { value: '24/7', label: '随时陪伴' },
    ],
    value: {
      eyebrow: '为什么不一样',
      h2: '每个 AI 都会忘记你。',
      h2em: '拍拍不会。',
      body: '市面上的 AI 每次对话都从零开始。拍拍记得你的名字、你的喜好、你上次聊到一半的事。它不是在模拟关心——它真的在积累对你的了解。',
      cards: [
        { icon: '🧠', title: '持久记忆', desc: '跨对话记住你说过的重要事情' },
        { icon: '💛', title: '情绪感知', desc: '感知你的状态，调整陪伴方式' },
        { icon: '🔍', title: '真实能力', desc: '搜索、天气、提醒——不只是聊天' },
      ],
    },
    how: {
      eyebrow: '三步开始',
      h2: '简单到不需要教程。',
      steps: [
        { num: '01', title: '登录', desc: 'GitHub 或 Google 一键登录，不需要填任何表单。' },
        { num: '02', title: '聊天', desc: '跟拍拍说任何事。它会自然地记住重要的细节。' },
        { num: '03', title: '它越来越懂你', desc: '聊得越多，拍拍对你了解越深。就像真正的朋友一样。' },
      ],
    },
    memory: {
      eyebrow: '核心能力',
      h2: '记忆，',
      h2em: '不是噱头。',
      body: '拍拍会自动从对话中提取重要信息，形成对你的长期了解。你可以随时查看和管理它记住的一切。',
      items: ['你的偏好和习惯', '你提到的重要的人', '你最近的心情变化', '你在意的事情', '你的日程和计划', '你分享过的故事'],
    },
    growth: {
      eyebrow: '关系会成长',
      h2: '从陌生人，',
      h2em: '到老朋友。',
      body: '你们的关系不是固定的。随着对话的深入，拍拍会从礼貌的陌生人，变成可以开玩笑的朋友，最终成为真正懂你的知己。',
      stages: [
        { emoji: '👋', label: '初识', desc: '礼貌、好奇' },
        { emoji: '☕', label: '熟悉', desc: '放松、自然' },
        { emoji: '😄', label: '默契', desc: '可以开玩笑' },
        { emoji: '💜', label: '知己', desc: '深度理解' },
      ],
    },
    opensource: {
      eyebrow: '开源项目',
      h2: '透明、免费、',
      h2em: '由社区驱动。',
      body: 'OpenPat 是一个开源项目。我们相信 AI 伴侣应该是透明的——你可以看到它的每一行代码，知道它如何处理你的数据。',
      star: 'Star on GitHub',
      chat: '开始聊天',
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
      h1: ['A little friend', 'who gets you.'],
      sub: 'Not a tool. Not an assistant. A companion that remembers you, understands you, and grows with you.',
      cta: 'Start Chatting',
      secondary: 'Learn More',
    },
    stats: [
      { value: 'Open Source', label: 'Completely free' },
      { value: '∞', label: 'Persistent memory' },
      { value: '24/7', label: 'Always there' },
    ],
    value: {
      eyebrow: 'Why it\'s different',
      h2: 'Every AI forgets you.',
      h2em: 'Pat doesn\'t.',
      body: 'Every AI out there starts from scratch each conversation. Pat remembers your name, your preferences, the thing you were talking about last time. It\'s not simulating care — it\'s genuinely building an understanding of you.',
      cards: [
        { icon: '🧠', title: 'Persistent Memory', desc: 'Remembers important things across conversations' },
        { icon: '💛', title: 'Emotion Aware', desc: 'Senses your mood and adjusts how it responds' },
        { icon: '🔍', title: 'Real Capabilities', desc: 'Search, weather, reminders — not just chat' },
      ],
    },
    how: {
      eyebrow: 'Three steps',
      h2: 'So simple, no tutorial needed.',
      steps: [
        { num: '01', title: 'Sign in', desc: 'One click with GitHub or Google. No forms to fill.' },
        { num: '02', title: 'Chat', desc: 'Tell Pat anything. It naturally remembers the important details.' },
        { num: '03', title: 'It learns you', desc: 'The more you chat, the deeper Pat knows you. Like a real friend.' },
      ],
    },
    memory: {
      eyebrow: 'Core feature',
      h2: 'Memory, ',
      h2em: 'not a gimmick.',
      body: 'Pat automatically extracts important information from conversations and builds a long-term understanding of you. You can view and manage everything it remembers.',
      items: ['Your preferences & habits', 'People you mention', 'Your recent mood shifts', 'Things you care about', 'Your plans & schedule', 'Stories you\'ve shared'],
    },
    growth: {
      eyebrow: 'Relationships grow',
      h2: 'From stranger, ',
      h2em: 'to confidant.',
      body: 'Your relationship isn\'t static. As conversations deepen, Pat evolves from a polite stranger, to a friend who jokes with you, to a confidant who truly understands you.',
      stages: [
        { emoji: '👋', label: 'Just met', desc: 'Polite, curious' },
        { emoji: '☕', label: 'Familiar', desc: 'Relaxed, natural' },
        { emoji: '😄', label: 'In sync', desc: 'Can joke around' },
        { emoji: '💜', label: 'Confidant', desc: 'Deep understanding' },
      ],
    },
    opensource: {
      eyebrow: 'Open source',
      h2: 'Transparent, free, ',
      h2em: 'community-driven.',
      body: 'OpenPat is open source. We believe AI companions should be transparent — you can see every line of code and know exactly how your data is handled.',
      star: 'Star on GitHub',
      chat: 'Start Chatting',
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

      {/* ── Stats strip ───────────────────────────────────────── */}
      <div className="lp-stats">
        {t.stats.map((s, i) => (
          <div key={i} className="lp-stat">
            <span className="lp-stat-value">{s.value}</span>
            <span className="lp-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Value proposition ─────────────────────────────────── */}
      <section id="about" className="lp-section lp-value">
        <Reveal>
          <p className="lp-eyebrow">{t.value.eyebrow}</p>
          <h2 className="lp-h2">{t.value.h2}<br /><span className="lp-h2-em">{t.value.h2em}</span></h2>
          <p className="lp-body">{t.value.body}</p>
        </Reveal>
        <div className="lp-value-cards">
          {t.value.cards.map((c, i) => (
            <Reveal key={i} className="lp-value-card" delay={i * 120}>
              <span className="lp-value-card-icon">{c.icon}</span>
              <h3 className="lp-value-card-title">{c.title}</h3>
              <p className="lp-value-card-desc">{c.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section className="lp-section lp-how">
        <Reveal>
          <p className="lp-eyebrow">{t.how.eyebrow}</p>
          <h2 className="lp-h2">{t.how.h2}</h2>
        </Reveal>
        <div className="lp-how-steps">
          {t.how.steps.map((s, i) => (
            <Reveal key={i} className="lp-how-step" delay={i * 150}>
              <span className="lp-how-num">{s.num}</span>
              <h3 className="lp-how-title">{s.title}</h3>
              <p className="lp-how-desc">{s.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Memory ────────────────────────────────────────────── */}
      <section className="lp-section lp-memory">
        <div className="lp-memory-inner">
          <Reveal className="lp-memory-copy">
            <p className="lp-eyebrow">{t.memory.eyebrow}</p>
            <h2 className="lp-h2">{t.memory.h2}<span className="lp-h2-em">{t.memory.h2em}</span></h2>
            <p className="lp-body">{t.memory.body}</p>
          </Reveal>
          <Reveal className="lp-memory-visual" delay={200}>
            <div className="lp-memory-grid">
              {t.memory.items.map((item, i) => (
                <div key={i} className="lp-memory-chip">
                  <span className="lp-memory-chip-dot" />
                  {item}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Relationship growth ───────────────────────────────── */}
      <section className="lp-section lp-growth">
        <Reveal>
          <p className="lp-eyebrow">{t.growth.eyebrow}</p>
          <h2 className="lp-h2">{t.growth.h2}<span className="lp-h2-em">{t.growth.h2em}</span></h2>
          <p className="lp-body">{t.growth.body}</p>
        </Reveal>
        <div className="lp-growth-stages">
          {t.growth.stages.map((s, i) => (
            <Reveal key={i} className="lp-growth-stage" delay={i * 120}>
              <span className="lp-growth-emoji">{s.emoji}</span>
              <span className="lp-growth-label">{s.label}</span>
              <span className="lp-growth-desc">{s.desc}</span>
              {i < t.growth.stages.length - 1 && <span className="lp-growth-arrow" />}
            </Reveal>
          ))}
        </div>
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
