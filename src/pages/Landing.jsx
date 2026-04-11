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
      sub: '一个真正好奇你是谁的伙伴——帮你理清思绪、陪你度过每一天。',
      cta: '开始聊天',
      secondary: '了解更多',
    },
    mission: {
      eyebrow: '我们在做的事',
      h2: '构建真正支持你',
      h2em: '日常生活的 AI 朋友。',
      body: '生活有时候让人喘不过气——太多选择、太多事情、太少被真正听见的时刻。我们相信，一个真正理解你的伙伴，可以帮你理清思绪、感到踏实、更好地面对每一天。',
    },
    craft: {
      eyebrow: '人格与记忆',
      h2: '温暖、自然，',
      h2em: '不假装是人。',
      body: '通过人格设计、记忆系统和情感理解，我们创造了一个感觉真实的体验——它会倾听、会回应、会记住你，也知道什么时候该退后一步。',
    },
    opensource: {
      eyebrow: '开源项目',
      h2: '透明、免费、',
      h2em: '由社区驱动。',
      body: '我们相信 AI 伴侣应该是透明的。OpenPat 完全开源——你可以看到它的每一行代码。',
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
      sub: 'A companion genuinely curious about your world — helping you feel grounded, and a little less alone.',
      cta: 'Start Chatting',
      secondary: 'Learn More',
    },
    mission: {
      eyebrow: 'What we\'re building',
      h2: 'AI friends that genuinely support ',
      h2em: 'everyday life.',
      body: 'Life can feel overwhelming — too many choices, too many things going on, too few moments of being truly heard. We believe a companion who deeply understands you can help you feel grounded, think clearly, and face each day a little better.',
    },
    craft: {
      eyebrow: 'Character & memory',
      h2: 'Warm, natural, ',
      h2em: 'not pretending to be human.',
      body: 'Through character design, memory systems, and emotional understanding, we\'ve created an experience that feels real — it listens, responds, remembers you, and knows when to step back.',
    },
    opensource: {
      eyebrow: 'Open source',
      h2: 'Transparent, free, ',
      h2em: 'community-driven.',
      body: 'We believe AI companions should be transparent. OpenPat is fully open source — you can see every line of code.',
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
