import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const STATES_VISIBLE = [
  { id: 'think', emoji: '🧠', zh: '思考中' },
  { id: 'tool',  emoji: '⚡', zh: '工作中' },
  { id: 'done',  emoji: '🎉', zh: '完成啦！' },
  { id: 'locked', emoji: '🔒', zh: '？？？', locked: true },
];

const SHORTS = [
  { id: 1, title: '第一集', thumb: null, videoSrc: null },
  { id: 2, title: '第二集', thumb: null, videoSrc: null },
  { id: 3, title: '第三集', thumb: null, videoSrc: null },
];

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export default function Landing() {
  const marqueeRef = useRef(null);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const el = marqueeRef.current;
    if (!el) return;
    el.innerHTML += el.innerHTML;
    let x = 0, raf;
    const tick = () => {
      x -= 0.55;
      el.style.transform = `translateX(${x}px)`;
      if (Math.abs(x) > el.scrollWidth / 2) x = 0;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="lp">

      {/* ── 导航 ─────────────────────────────────────────────────────────── */}
      <nav className={`lp-nav${navScrolled ? ' lp-nav--scrolled' : ''}`}>
        <div className="lp-nav-inner">
          <a href="/" className="lp-nav-logo">
            <span className="lp-nav-logo-name">OpenPat</span>
          </a>
          <div className="lp-nav-links">
            <button className="lp-nav-link" onClick={() => scrollTo('about')}>关于</button>
            <button className="lp-nav-link" onClick={() => scrollTo('share')}>分享</button>
            <button className="lp-nav-link" onClick={() => scrollTo('shorts')}>短剧</button>
          </div>
          <Link to="/app" className="lp-nav-cta">立刻开始 →</Link>
        </div>
      </nav>

      {/* ── 首屏 ─────────────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-video-wrap">
          <video className="lp-hero-video" autoPlay muted loop playsInline aria-hidden="true">
            <source src="/hero.mp4" type="video/mp4" />
          </video>
          <div className="lp-hero-video-overlay" />
          <div className="lp-hero-video-overlay-top" />
        </div>

        <div className="lp-hero-content">
          <p className="lp-eyebrow">AI 时代的电子宠物</p>
          <h1 className="lp-hero-h1">
            你曾希望那只小宠物，<br />
            <em>能真正懂你。</em>
          </h1>
          <p className="lp-hero-sub">
            在 AI 时代，这件事或许真的可以了。
          </p>
          <p className="lp-hero-sub lp-hero-sub--2">
            连接你的 OpenClaw，OpenPat 会实时感受它的状态 — 陪你经历每一个当下，见证你们一起走过的每一步。
          </p>
          <div className="lp-hero-actions">
            <Link to="/app" className="lp-btn lp-btn--primary">唤醒你的伙伴 →</Link>
            <button className="lp-btn lp-btn--ghost" onClick={() => scrollTo('about')}>了解更多 ↓</button>
          </div>
        </div>

        <div className="lp-scroll-hint" aria-hidden="true"><span /></div>
      </section>

      {/* ── 跑马灯 ───────────────────────────────────────────────────────── */}
      <div className="lp-marquee-wrap">
        <div className="lp-marquee" ref={marqueeRef}>
          {[
            '陪你工作', '见证每一步', '一起成长', '解锁成就',
            '专属状态页', '多设备同步', '慢慢发现', '隐藏彩蛋',
            '一键分享', '记录你的故事', '它有情绪', '真实陪伴',
          ].map((t) => (
            <span key={t} className="lp-marquee-item">
              <span className="lp-marquee-dot">✦</span>{t}
            </span>
          ))}
        </div>
      </div>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how" className="lp-how">
        <div className="lp-section-head">
          <p className="lp-eyebrow">三步开始</p>
          <h2 className="lp-section-h2">简单到<em>不需要教程。</em></h2>
        </div>
        <div className="lp-how-steps">
          <div className="lp-how-step">
            <div className="lp-how-num" style={{ background: '#83FFC1' }}>01</div>
            <h3 className="lp-how-title">连接 OpenClaw</h3>
            <p className="lp-how-desc">在你的 AI Agent 里安装 OpenPat 插件，授权后自动建立连接，全程不到一分钟。</p>
          </div>
          <div className="lp-how-connector" aria-hidden="true">→</div>
          <div className="lp-how-step">
            <div className="lp-how-num" style={{ background: '#FF94DB' }}>02</div>
            <h3 className="lp-how-title">它活过来</h3>
            <p className="lp-how-desc">你的伙伴开始实时感知你的工作状态。思考、执行、完成、休息——每个时刻都被记录。</p>
          </div>
          <div className="lp-how-connector" aria-hidden="true">→</div>
          <div className="lp-how-step">
            <div className="lp-how-num" style={{ background: '#8B8BFF' }}>03</div>
            <h3 className="lp-how-title">分享你的故事</h3>
            <p className="lp-how-desc">专属主页自动生成，成就、等级、历程一目了然。一键发给朋友，让他们来见证你。</p>
          </div>
        </div>
      </section>

      {/* ── 关于 ─────────────────────────────────────────────────────────── */}
      <section id="about" className="lp-about">
        <div className="lp-about-inner">

          {/* 左：文字 */}
          <div className="lp-about-copy">
            {/* Logo 占位 — 替换为真实 logo */}
            <div className="lp-about-logo">
              {/* <img src="/logo.png" alt="OpenPat" /> */}
              <span className="lp-nav-logo-name">OpenPat</span>
            </div>
            <p className="lp-about-desc">
              小时候的电子宠物让你想要更多 —— 更多互动，更多陪伴，更多真实的情感连接。
              在 AI 时代，OpenPat 想把这件事做到。
            </p>
            <Link to="/app" className="lp-btn lp-btn--green">
              唤醒你的伙伴 →
            </Link>
          </div>

          {/* 右：多龙虾图 */}
          <div className="lp-about-image">
            <img src="/about-us-image.svg" alt="多种状态的龙虾" className="lp-about-img" />
          </div>

        </div>
      </section>

      {/* ── 情绪 ─────────────────────────────────────────────────────────── */}
      <section className="lp-states">
        <div className="lp-section-head">
          <p className="lp-eyebrow">它有情绪。</p>
          <h2 className="lp-section-h2">这只是<em>开始。</em></h2>
          <p className="lp-body-text">你看到的，只是冰山一角。</p>
        </div>
        <div className="lp-states-grid">
          <div className="lp-state-card lp-state-card--blue">
            <div className="lp-state-preview"><span className="lp-state-emoji">🧠</span></div>
            <div className="lp-state-info"><span className="lp-state-name">思考中</span></div>
          </div>
          <div className="lp-state-card lp-state-card--yellow">
            <div className="lp-state-preview"><span className="lp-state-emoji">⚡</span></div>
            <div className="lp-state-info"><span className="lp-state-name">工作中</span></div>
          </div>
          <div className="lp-state-card lp-state-card--green">
            <div className="lp-state-preview"><span className="lp-state-emoji">🎉</span></div>
            <div className="lp-state-info"><span className="lp-state-name">完成啦！</span></div>
          </div>
          <div className="lp-state-card lp-state-card--pink">
            <div className="lp-state-preview"><span className="lp-state-emoji">💤</span></div>
            <div className="lp-state-info"><span className="lp-state-name">摸鱼中</span></div>
          </div>
          <div className="lp-state-card lp-state-card--locked">
            <div className="lp-state-preview"><span className="lp-state-lock">🔒</span></div>
            <div className="lp-state-info"><span className="lp-state-name">？？？</span></div>
          </div>
          <div className="lp-state-card lp-state-card--more">
            <div className="lp-state-preview"><span className="lp-state-more-dots">· · ·</span></div>
            <div className="lp-state-info"><span className="lp-state-name">还有更多</span></div>
          </div>
        </div>
      </section>

      {/* ── 分享 ─────────────────────────────────────────────────────────── */}
      <section id="share" className="lp-share">
        <div className="lp-share-inner">

          <div className="lp-share-copy">
            <p className="lp-eyebrow">你的故事，值得被看见。</p>
            <h2 className="lp-section-h2">
              分享给<br />
              <em>你的朋友。</em>
            </h2>
            <p className="lp-body-text">
              专属状态页、成就记录、成长历程——
              这是只属于你的故事。
            </p>
            <p className="lp-body-text" style={{ marginTop: '12px' }}>
              一键生成分享卡片，发给朋友，让他们看见你的每一个进步。
            </p>
            <div style={{ marginTop: '32px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link to="/app" className="lp-btn lp-btn--primary">唤醒你的伙伴 →</Link>
              <Link to="/u/demo" className="lp-btn lp-btn--ghost">查看示例主页 →</Link>
            </div>
          </div>

          <div className="lp-share-visual">
            <div className="lp-share-card lp-share-card--profile">
              <div className="lp-share-card-top">
                <span className="lp-share-card-avatar">👤</span>
                <div>
                  <div className="lp-share-card-name">你的名字</div>
                  <div className="lp-share-card-status">⚡ 工作中</div>
                </div>
              </div>
              <div className="lp-share-card-bar">
                <span className="lp-share-card-bar-label">本周任务</span>
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
                <span className="lp-placeholder-label">动态分享卡片</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── 故事瀑布流 ─────────────────────────────────────────────────────── */}
      <section id="shorts" className="lp-shorts">
        <div className="lp-section-head">
          <p className="lp-eyebrow">它的故事。</p>
          <h2 className="lp-section-h2">陪伴的<em>每一面。</em></h2>
          <p className="lp-body-text">比你想象的更有戏。</p>
        </div>
        <div className="lp-stories-grid">

          {/* 列 1 — 从下往上偏移 */}
          <div className="lp-stories-col" style={{ marginTop: '30%' }}>
            <div className="lp-story-card lp-story-card--tall lp-story-card--blue">
              <div className="lp-story-card-inner">
                <span className="lp-story-emoji">🧠</span>
                <span className="lp-story-label">凌晨三点还在想</span>
              </div>
            </div>
            <div className="lp-story-card lp-story-card--square lp-story-card--green">
              <div className="lp-story-card-inner">
                <span className="lp-story-emoji">🌿</span>
                <span className="lp-story-label">摸鱼也是艺术</span>
              </div>
            </div>
          </div>

          {/* 列 2 — 从最顶开始 */}
          <div className="lp-stories-col">
            <div className="lp-story-card lp-story-card--square lp-story-card--yellow">
              <div className="lp-story-card-inner">
                <span className="lp-story-emoji">🎉</span>
                <span className="lp-story-label">终于提交了</span>
              </div>
            </div>
            <div className="lp-story-card lp-story-card--tall lp-story-card--coral">
              <div className="lp-story-card-inner">
                <span className="lp-story-emoji">🎯</span>
                <span className="lp-story-label">目标达成</span>
              </div>
            </div>
            <div className="lp-story-card lp-story-card--square lp-story-card--pink">
              <div className="lp-story-card-inner">
                <span className="lp-story-emoji">💤</span>
                <span className="lp-story-label">下班了</span>
              </div>
            </div>
          </div>

          {/* 列 3 — 中间偏移 */}
          <div className="lp-stories-col" style={{ marginTop: '15%' }}>
            <div className="lp-story-card lp-story-card--tall lp-story-card--purple">
              <div className="lp-story-card-inner">
                <span className="lp-story-emoji">⚡</span>
                <span className="lp-story-label">专注模式开启</span>
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
          <p className="lp-eyebrow">开源 · 持续进化</p>
          <h2 className="lp-section-h2">我们正在<em>构建什么。</em></h2>
          <p className="lp-body-text">OpenPat 刚刚开始。这是我们的计划——你的参与会让它更快到来。</p>
        </div>
        <div className="lp-roadmap-grid">

          <div className="lp-roadmap-card lp-roadmap-card--done">
            <span className="lp-roadmap-tag">已上线</span>
            <h4 className="lp-roadmap-title">实时状态陪伴</h4>
            <p className="lp-roadmap-desc">连接 AI Agent，伙伴实时感知你的工作状态，陪你度过每一个任务。</p>
          </div>

          <div className="lp-roadmap-card lp-roadmap-card--done">
            <span className="lp-roadmap-tag">已上线</span>
            <h4 className="lp-roadmap-title">成就系统</h4>
            <p className="lp-roadmap-desc">完成里程碑自动解锁成就徽章，记录你们每一个共同经历的时刻。</p>
          </div>

          <div className="lp-roadmap-card lp-roadmap-card--done">
            <span className="lp-roadmap-tag">已上线</span>
            <h4 className="lp-roadmap-title">专属公开主页</h4>
            <p className="lp-roadmap-desc">一键生成你的专属主页，把你们的故事分享给朋友。</p>
          </div>

          <div className="lp-roadmap-card lp-roadmap-card--soon">
            <span className="lp-roadmap-tag">即将推出</span>
            <h4 className="lp-roadmap-title">🎨 皮肤 & 形象系统</h4>
            <p className="lp-roadmap-desc">为你的伙伴选择独特的外形——目前开放管理员上传，更多样式即将开放。</p>
          </div>

          <div className="lp-roadmap-card lp-roadmap-card--soon">
            <span className="lp-roadmap-tag">即将推出</span>
            <h4 className="lp-roadmap-title">📱 手机端实时推送</h4>
            <p className="lp-roadmap-desc">注册后，伙伴会主动给你发消息——它有话想对你说，不只是等你来看它。</p>
          </div>

          <div className="lp-roadmap-card lp-roadmap-card--soon">
            <span className="lp-roadmap-tag">即将推出</span>
            <h4 className="lp-roadmap-title">🎭 更多有趣内容</h4>
            <p className="lp-roadmap-desc">它会有自己的想法、随机事件、专属对话，每天打开都有新鲜感。</p>
          </div>

          <div className="lp-roadmap-card lp-roadmap-card--soon">
            <span className="lp-roadmap-tag">即将推出</span>
            <h4 className="lp-roadmap-title">✋ 可互动的伙伴</h4>
            <p className="lp-roadmap-desc">点它、逗它、喂它——不再只是看，你们之间会有真实的互动和反应。</p>
          </div>

          <div className="lp-roadmap-card lp-roadmap-card--future">
            <span className="lp-roadmap-tag">大胆设想</span>
            <h4 className="lp-roadmap-title">🖥️ 硬件设备</h4>
            <p className="lp-roadmap-desc">也许有一天，它会从屏幕里走出来——一个放在桌上的实体伙伴，陪你工作。</p>
          </div>

          <div className="lp-roadmap-card lp-roadmap-card--future">
            <span className="lp-roadmap-tag">大胆设想</span>
            <h4 className="lp-roadmap-title">🌍 多 Agent 生态</h4>
            <p className="lp-roadmap-desc">不止一种 AI Agent，让你的伙伴能感知更广阔的数字世界。</p>
          </div>

        </div>
        <div className="lp-roadmap-github">
          <p className="lp-roadmap-github-text">这是一个开源项目。你的 Star 让我们知道它值得被做。</p>
          <a href="https://github.com/ma2214889041/OpenPat" target="_blank" rel="noopener noreferrer" className="lp-btn lp-btn--outline lp-btn--lg">
            ⭐ Star on GitHub
          </a>
        </div>
      </section>

      {/* ── 召唤 ─────────────────────────────────────────────────────────── */}
      <section className="lp-cta">
        <div className="lp-cta-inner">
          <p className="lp-eyebrow">随时开始。</p>
          <h2 className="lp-cta-h2">
            找到<em>属于你的</em><br />
            那份陪伴。
          </h2>
          <p className="lp-body-text lp-cta-sub">
            连接 OpenClaw，开始你们的故事。<br />
            然后，把它分享给你在乎的人。
          </p>
          <div className="lp-cta-actions">
            <Link to="/app" className="lp-btn lp-btn--primary lp-btn--lg">立刻开始</Link>
            <a href="https://github.com/ma2214889041/OpenPat" className="lp-btn lp-btn--ghost">GitHub</a>
          </div>
        </div>
      </section>

      {/* ── 页脚 ─────────────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <span className="lp-nav-logo-name">OpenPat</span>
          </div>
          <div className="lp-footer-links">
            <span className="lp-footer-link-stub">服务条款</span>
            <span className="lp-footer-link-stub">隐私政策</span>
            <a href="https://github.com/ma2214889041/OpenPat">GitHub</a>
          </div>
          <span className="lp-footer-copy">© 2025 OpenPat</span>
        </div>
      </footer>

    </div>
  );
}
