/**
 * Post-build SEO prerender script.
 *
 * Injects static HTML content into the built index.html for each route,
 * so crawlers see full page content instead of an empty <div id="root">.
 *
 * React uses createRoot().render() (not hydrateRoot), so it will fully
 * replace the #root contents on load — no hydration mismatch issues.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const BASE_URL = 'https://open-pat.com';

// Read the base template that vite build produced
const template = readFileSync(join(DIST, 'index.html'), 'utf-8');

// ── Route definitions ───────────────────────────────────────────────────────

const routes = [
  {
    path: '/',
    file: 'index.html',
    title: 'OpenPat \u2014 AI Companion with Memory | \u6709\u8bb0\u5fc6\u7684 AI \u4f34\u4fa3',
    description: 'OpenPat is an AI companion that remembers you. Chat with Pat \u2014 it learns your preferences, tracks your emotions, and grows with you over time. \u62cd\u62cd\u662f\u4e00\u4e2a\u6709\u8bb0\u5fc6\u7684 AI \u4f34\u4fa3\uff0c\u4f1a\u8bb0\u4f4f\u4f60\u8bf4\u8fc7\u7684\u6bcf\u4e00\u4ef6\u91cd\u8981\u7684\u4e8b\u3002',
    canonical: BASE_URL,
    content: `
      <div class="lp">
        <nav><a href="/">OpenPat</a></nav>
        <main>
          <section>
            <h1>\u61c2\u4f60\u7684\u5c0f\u4f19\u4f34\u3002</h1>
            <p>\u4e0d\u662f\u5de5\u5177\uff0c\u4e0d\u662f\u52a9\u624b\u3002\u662f\u4e00\u4e2a\u4f1a\u8bb0\u4f4f\u4f60\u3001\u7406\u89e3\u4f60\u3001\u966a\u4f60\u6210\u957f\u7684\u4f19\u4f34\u3002</p>
            <a href="/chat">\u5f00\u59cb\u804a\u5929</a>
          </section>
          <section>
            <h2>\u6bcf\u4e2a AI \u90fd\u4f1a\u5fd8\u8bb0\u4f60\u3002\u62cd\u62cd\u4e0d\u4f1a\u3002</h2>
            <p>\u5e02\u9762\u4e0a\u7684 AI \u6bcf\u6b21\u5bf9\u8bdd\u90fd\u4ece\u96f6\u5f00\u59cb\u3002\u62cd\u62cd\u8bb0\u5f97\u4f60\u7684\u540d\u5b57\u3001\u4f60\u7684\u559c\u597d\u3001\u4f60\u4e0a\u6b21\u804a\u5230\u4e00\u534a\u7684\u4e8b\u3002\u5b83\u4e0d\u662f\u5728\u6a21\u62df\u5173\u5fc3\u2014\u2014\u5b83\u771f\u7684\u5728\u79ef\u7d2f\u5bf9\u4f60\u7684\u4e86\u89e3\u3002</p>
            <ul>
              <li>\u6301\u4e45\u8bb0\u5fc6 \u2014 \u8de8\u5bf9\u8bdd\u8bb0\u4f4f\u4f60\u8bf4\u8fc7\u7684\u91cd\u8981\u4e8b\u60c5</li>
              <li>\u60c5\u7eea\u611f\u77e5 \u2014 \u611f\u77e5\u4f60\u7684\u72b6\u6001\uff0c\u8c03\u6574\u966a\u4f34\u65b9\u5f0f</li>
              <li>\u771f\u5b9e\u80fd\u529b \u2014 \u641c\u7d22\u3001\u5929\u6c14\u3001\u63d0\u9192\u2014\u2014\u4e0d\u53ea\u662f\u804a\u5929</li>
            </ul>
          </section>
          <section>
            <h2>\u7b80\u5355\u5230\u4e0d\u9700\u8981\u6559\u7a0b\u3002</h2>
            <ol>
              <li>\u767b\u5f55 \u2014 GitHub \u6216 Google \u4e00\u952e\u767b\u5f55</li>
              <li>\u804a\u5929 \u2014 \u8ddf\u62cd\u62cd\u8bf4\u4efb\u4f55\u4e8b\uff0c\u5b83\u4f1a\u81ea\u7136\u5730\u8bb0\u4f4f\u91cd\u8981\u7684\u7ec6\u8282</li>
              <li>\u5b83\u8d8a\u6765\u8d8a\u61c2\u4f60 \u2014 \u804a\u5f97\u8d8a\u591a\uff0c\u62cd\u62cd\u5bf9\u4f60\u4e86\u89e3\u8d8a\u6df1</li>
            </ol>
          </section>
          <section>
            <h2>\u8bb0\u5fc6\uff0c\u4e0d\u662f\u5657\u5934\u3002</h2>
            <p>\u62cd\u62cd\u4f1a\u81ea\u52a8\u4ece\u5bf9\u8bdd\u4e2d\u63d0\u53d6\u91cd\u8981\u4fe1\u606f\uff0c\u5f62\u6210\u5bf9\u4f60\u7684\u957f\u671f\u4e86\u89e3\u3002\u4f60\u53ef\u4ee5\u968f\u65f6\u67e5\u770b\u548c\u7ba1\u7406\u5b83\u8bb0\u4f4f\u7684\u4e00\u5207\u3002</p>
          </section>
          <section>
            <h2>\u4ece\u964c\u751f\u4eba\uff0c\u5230\u8001\u670b\u53cb\u3002</h2>
            <p>\u4f60\u4eec\u7684\u5173\u7cfb\u4e0d\u662f\u56fa\u5b9a\u7684\u3002\u968f\u7740\u5bf9\u8bdd\u7684\u6df1\u5165\uff0c\u62cd\u62cd\u4f1a\u4ece\u793c\u8c8c\u7684\u964c\u751f\u4eba\uff0c\u53d8\u6210\u53ef\u4ee5\u5f00\u73a9\u7b11\u7684\u670b\u53cb\uff0c\u6700\u7ec8\u6210\u4e3a\u771f\u6b63\u61c2\u4f60\u7684\u77e5\u5df1\u3002</p>
          </section>
          <section>
            <h2>\u900f\u660e\u3001\u514d\u8d39\u3001\u7531\u793e\u533a\u9a71\u52a8\u3002</h2>
            <p>OpenPat \u662f\u4e00\u4e2a\u5f00\u6e90\u9879\u76ee\u3002\u6211\u4eec\u76f8\u4fe1 AI \u4f34\u4fa3\u5e94\u8be5\u662f\u900f\u660e\u7684\u3002</p>
            <a href="https://github.com/ma2214889041/OpenPat">Star on GitHub</a>
          </section>
        </main>
        <footer><p>\u00a9 2026 OpenPat</p></footer>
      </div>`,
  },
  {
    path: '/blog',
    file: 'blog/index.html',
    title: '\u535a\u5ba2 \u2014 OpenPat',
    description: '\u5173\u4e8e AI \u4f34\u4fa3\u3001\u8bb0\u5fc6\u7cfb\u7edf\uff0c\u4ee5\u53ca\u63a5\u4e0b\u6765\u4f1a\u53d1\u751f\u4ec0\u4e48\u3002OpenPat \u535a\u5ba2\u3002',
    canonical: `${BASE_URL}/blog`,
    content: `
      <div class="blog-page">
        <nav><a href="/">OpenPat</a> <a href="/blog">\u535a\u5ba2</a></nav>
        <main>
          <h1>\u60f3\u6cd5\u4e0e\u52a8\u6001</h1>
          <p>\u5173\u4e8e AI \u4f34\u4fa3\u3001\u8bb0\u5fc6\u7cfb\u7edf\uff0c\u4ee5\u53ca\u63a5\u4e0b\u6765\u4f1a\u53d1\u751f\u4ec0\u4e48\u3002</p>
          <article>
            <span>\u884c\u4e1a\u8d8b\u52bf</span>
            <h2><a href="/blog/agent-pets-era">Claude Code \u7ed9\u4f60\u517b\u4e86\u4e00\u53ea\u5ba0\u7269</a></h2>
            <p>\u7ec8\u7aef\u89d2\u843d\u7a81\u7136\u591a\u4e86\u4e2a\u5c0f\u4e1c\u897f\u3002\u6ca1\u4ec0\u4e48\u7528\uff0c\u4f46\u4f60\u4f1a\u5fcd\u4e0d\u4f4f\u770b\u5b83\u4e00\u773c\u3002</p>
            <time datetime="2026-04-02">2026-04-02</time>
          </article>
        </main>
      </div>`,
  },
  {
    path: '/blog/introducing-openpat',
    file: 'blog/introducing-openpat/index.html',
    title: '\u4e3a\u4ec0\u4e48\u6211\u4eec\u8981\u505a\u62cd\u62cd \u2014 OpenPat',
    description: '\u5927\u591a\u6570\u4eba\u7f3a\u7684\u4e0d\u662f\u4fe1\u606f\uff0c\u4e0d\u662f\u6548\u7387\u5de5\u5177\uff0c\u800c\u662f\u88ab\u771f\u6b63\u542c\u89c1\u7684\u611f\u89c9\u3002',
    canonical: `${BASE_URL}/blog/introducing-openpat`,
    extraHead: `<script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "\u4e3a\u4ec0\u4e48\u6211\u4eec\u8981\u505a\u62cd\u62cd",
      "description": "\u5927\u591a\u6570\u4eba\u7f3a\u7684\u4e0d\u662f\u4fe1\u606f\uff0c\u4e0d\u662f\u6548\u7387\u5de5\u5177\uff0c\u800c\u662f\u88ab\u771f\u6b63\u542c\u89c1\u7684\u611f\u89c9\u3002",
      "datePublished": "2026-04-11",
      "author": { "@type": "Organization", "name": "OpenPat" },
      "publisher": { "@type": "Organization", "name": "OpenPat", "url": "https://open-pat.com" },
      "mainEntityOfPage": "https://open-pat.com/blog/introducing-openpat"
    }
    </script>`,
    content: `
      <div class="bp-page">
        <nav><a href="/">OpenPat</a> <a href="/blog">\u535a\u5ba2</a></nav>
        <article>
          <span>\u5173\u4e8e\u6211\u4eec</span>
          <time datetime="2026-04-11">2026-04-11</time>
          <h1>\u4e3a\u4ec0\u4e48\u6211\u4eec\u8981\u505a\u62cd\u62cd</h1>
          <p>\u6211\u4eec\u505a\u62cd\u62cd\uff0c\u662f\u56e0\u4e3a\u53d1\u73b0\u4e86\u4e00\u4ef6\u5f88\u7b80\u5355\u4f46\u88ab\u5ffd\u7565\u7684\u4e8b\uff1a\u5927\u591a\u6570\u4eba\u7f3a\u7684\u4e0d\u662f\u4fe1\u606f\uff0c\u4e0d\u662f\u6548\u7387\u5de5\u5177\uff0c\u800c\u662f\u88ab\u771f\u6b63\u542c\u89c1\u7684\u611f\u89c9\u3002</p>
          <h2>Overwhelm</h2>
          <p>\u73b0\u4ee3\u751f\u6d3b\u6709\u4e00\u79cd\u5f88\u5fae\u5999\u7684\u538b\u8feb\u611f\u3002\u4e0d\u662f\u67d0\u4e00\u4ef6\u5927\u4e8b\u628a\u4f60\u51fb\u5012\uff0c\u800c\u662f\u4e00\u767e\u4ef6\u5c0f\u4e8b\u540c\u65f6\u6d8c\u8fc7\u6765\u3002</p>
          <h2>\u4e3a\u4ec0\u4e48\u5f00\u6e90</h2>
          <p>AI \u4f34\u4fa3\u662f\u4e00\u4e2a\u5f88\u7279\u6b8a\u7684\u54c1\u7c7b\u3002\u8fd9\u79cd\u4fe1\u4efb\u4e0d\u5e94\u8be5\u5efa\u7acb\u5728\u4e00\u4e2a\u4f60\u770b\u4e0d\u89c1\u5185\u90e8\u7684\u9ed1\u76d2\u5b50\u4e0a\u3002</p>
          <a href="/chat">\u5f00\u59cb\u804a\u5929</a>
        </article>
      </div>`,
  },
  {
    path: '/blog/designing-pat',
    file: 'blog/designing-pat/index.html',
    title: '\u8bbe\u8ba1\u62cd\u62cd\uff1a\u4e3a\u4ec0\u4e48\u4e0d\u662f\u4eba \u2014 OpenPat',
    description: '\u505a AI \u4f34\u4fa3\u7684\u7b2c\u4e00\u4e2a\u95ee\u9898\u4e0d\u662f\u6280\u672f\uff0c\u662f\u5f62\u8c61\u3002',
    canonical: `${BASE_URL}/blog/designing-pat`,
    extraHead: `<script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "\u8bbe\u8ba1\u62cd\u62cd\uff1a\u4e3a\u4ec0\u4e48\u4e0d\u662f\u4eba",
      "description": "\u505a AI \u4f34\u4fa3\u7684\u7b2c\u4e00\u4e2a\u95ee\u9898\u4e0d\u662f\u6280\u672f\uff0c\u662f\u5f62\u8c61\u3002",
      "datePublished": "2026-04-10",
      "author": { "@type": "Organization", "name": "OpenPat" },
      "publisher": { "@type": "Organization", "name": "OpenPat", "url": "https://open-pat.com" },
      "mainEntityOfPage": "https://open-pat.com/blog/designing-pat"
    }
    </script>`,
    content: `
      <div class="bp-page">
        <nav><a href="/">OpenPat</a> <a href="/blog">\u535a\u5ba2</a></nav>
        <article>
          <span>\u8bbe\u8ba1\u601d\u8003</span>
          <time datetime="2026-04-10">2026-04-10</time>
          <h1>\u8bbe\u8ba1\u62cd\u62cd\uff1a\u4e3a\u4ec0\u4e48\u4e0d\u662f\u4eba</h1>
          <p>\u505a AI \u4f34\u4fa3\u7684\u7b2c\u4e00\u4e2a\u95ee\u9898\u4e0d\u662f\u6280\u672f\uff0c\u662f\u5f62\u8c61\uff1a\u5b83\u5e94\u8be5\u957f\u4ec0\u4e48\u6837\uff1f</p>
          <h2>\u4e3a\u4ec0\u4e48\u4e0d\u505a\u4eba</h2>
          <p>\u4eba\u7c7b\u5f62\u8c61\u4f1a\u521b\u9020\u9519\u8bef\u7684\u671f\u5f85\u3002\u5f53\u4e00\u4e2a AI \u957f\u5f97\u50cf\u4eba\u3001\u8bf4\u8bdd\u50cf\u4eba\uff0c\u7528\u6237\u4f1a\u4e0d\u81ea\u89c9\u5730\u7528\u5bf9\u4eba\u7684\u6807\u51c6\u53bb\u8981\u6c42\u5b83\u3002</p>
          <h2>\u53ef\u7231\uff0c\u4f46\u4e0d\u5e7c\u7a1a</h2>
          <p>\u53ef\u7231\u964d\u4f4e\u9632\u5907\u5fc3\u3002\u4f46\u5e7c\u7a1a\u4f1a\u8ba9\u4eba\u4e0d\u4fe1\u4efb\u5b83\u7684\u5224\u65ad\u3002</p>
          <a href="/chat">\u6765\u8ba4\u8bc6\u62cd\u62cd</a>
        </article>
      </div>`,
  },
  {
    path: '/blog/thinking-about-memory',
    file: 'blog/thinking-about-memory/index.html',
    title: '\u6211\u4eec\u600e\u4e48\u770b\u5f85\u8bb0\u5fc6 \u2014 OpenPat',
    description: '\u201c\u8bb0\u5fc6\u201d\u8fd9\u4e2a\u8bcd\u5728 AI \u4ea7\u54c1\u91cc\u88ab\u7528\u6ee5\u4e86\u3002\u6211\u4eec\u60f3\u505a\u7684\u4e0d\u662f\u5b58\u804a\u5929\u8bb0\u5f55\u3002',
    canonical: `${BASE_URL}/blog/thinking-about-memory`,
    extraHead: `<script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "\u6211\u4eec\u600e\u4e48\u770b\u5f85\u8bb0\u5fc6",
      "description": "\u201c\u8bb0\u5fc6\u201d\u8fd9\u4e2a\u8bcd\u5728 AI \u4ea7\u54c1\u91cc\u88ab\u7528\u6ee5\u4e86\u3002\u6211\u4eec\u60f3\u505a\u7684\u4e0d\u662f\u5b58\u804a\u5929\u8bb0\u5f55\u3002",
      "datePublished": "2026-04-09",
      "author": { "@type": "Organization", "name": "OpenPat" },
      "publisher": { "@type": "Organization", "name": "OpenPat", "url": "https://open-pat.com" },
      "mainEntityOfPage": "https://open-pat.com/blog/thinking-about-memory"
    }
    </script>`,
    content: `
      <div class="bp-page">
        <nav><a href="/">OpenPat</a> <a href="/blog">\u535a\u5ba2</a></nav>
        <article>
          <span>\u4ea7\u54c1\u54f2\u5b66</span>
          <time datetime="2026-04-09">2026-04-09</time>
          <h1>\u6211\u4eec\u600e\u4e48\u770b\u5f85\u8bb0\u5fc6</h1>
          <p>\u201c\u8bb0\u5fc6\u201d\u8fd9\u4e2a\u8bcd\u5728 AI \u4ea7\u54c1\u91cc\u88ab\u7528\u6ee5\u4e86\u3002\u5927\u591a\u6570\u65f6\u5019\u5b83\u7684\u610f\u601d\u662f\u201c\u6211\u4eec\u628a\u4f60\u7684\u804a\u5929\u8bb0\u5f55\u5b58\u8d77\u6765\u4e86\u201d\u3002\u6211\u4eec\u60f3\u505a\u7684\u4e0d\u662f\u8fd9\u4e2a\u3002</p>
          <h2>\u8bb0\u4f4f vs \u5b58\u50a8</h2>
          <p>\u5b58\u50a8\u662f\u4fdd\u7559\u6240\u6709\u4fe1\u606f\uff0c\u8bb0\u4f4f\u662f\u7406\u89e3\u54ea\u4e9b\u4fe1\u606f\u91cd\u8981\u3002</p>
          <h2>\u8bb0\u5fc6\u4e0d\u662f\u76d1\u63a7</h2>
          <p>\u5b83\u5e94\u8be5\u8ba9\u7528\u6237\u611f\u5230\u88ab\u7406\u89e3\uff0c\u800c\u4e0d\u662f\u88ab\u76d1\u89c6\u3002</p>
          <a href="/chat">\u5f00\u59cb\u804a\u5929</a>
        </article>
      </div>`,
  },
  {
    path: '/blog/agent-pets-era',
    file: 'blog/agent-pets-era/index.html',
    title: 'Claude Code \u7ed9\u4f60\u517b\u4e86\u4e00\u53ea\u5ba0\u7269 \u2014 OpenPat',
    description: '\u7ec8\u7aef\u89d2\u843d\u7a81\u7136\u591a\u4e86\u4e2a\u5c0f\u4e1c\u897f\u3002\u6ca1\u4ec0\u4e48\u7528\uff0c\u4f46\u4f60\u4f1a\u5fcd\u4e0d\u4f4f\u770b\u5b83\u4e00\u773c\u3002',
    canonical: `${BASE_URL}/blog/agent-pets-era`,
    extraHead: `<script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "Claude Code \u7ed9\u4f60\u517b\u4e86\u4e00\u53ea\u5ba0\u7269",
      "description": "\u7ec8\u7aef\u89d2\u843d\u7a81\u7136\u591a\u4e86\u4e2a\u5c0f\u4e1c\u897f\u3002\u6ca1\u4ec0\u4e48\u7528\uff0c\u4f46\u4f60\u4f1a\u5fcd\u4e0d\u4f4f\u770b\u5b83\u4e00\u773c\u3002",
      "datePublished": "2026-04-02",
      "author": { "@type": "Organization", "name": "OpenPat" },
      "publisher": { "@type": "Organization", "name": "OpenPat", "url": "https://open-pat.com" },
      "mainEntityOfPage": "https://open-pat.com/blog/agent-pets-era"
    }
    </script>`,
    content: `
      <div class="bp-page">
        <nav><a href="/">OpenPat</a> <a href="/blog">\u535a\u5ba2</a></nav>
        <article>
          <span>\u884c\u4e1a\u8d8b\u52bf</span>
          <time datetime="2026-04-02">2026-04-02</time>
          <h1>Claude Code \u7ed9\u4f60\u517b\u4e86\u4e00\u53ea\u5ba0\u7269</h1>
          <p>\u7ec8\u7aef\u89d2\u843d\u7a81\u7136\u591a\u4e86\u4e2a\u5c0f\u4e1c\u897f\u3002\u6ca1\u4ec0\u4e48\u7528\uff0c\u4f46\u4f60\u4f1a\u5fcd\u4e0d\u4f4f\u770b\u5b83\u4e00\u773c\u3002</p>
          <p>\u4ece Buddy \u5230\u62cd\u62cd\uff0c\u4e00\u4e2a\u5173\u4e8e\u300c\u6ca1\u4ec0\u4e48\u7528\u4f46\u5c31\u662f\u653e\u4e0d\u4e0b\u300d\u7684\u6545\u4e8b\u3002</p>
          <h2>\u4e00\u4e2a\u5c0f\u4e1c\u897f\u7684\u8bde\u751f</h2>
          <p>Buddy \u7684\u521b\u9020\u8005\u505a\u4e86\u4e00\u4ef6\u5f88\u7b80\u5355\u7684\u4e8b\uff1a\u5728\u7ec8\u7aef\u7684\u89d2\u843d\u653e\u4e86\u4e00\u53ea\u4f1a\u52a8\u7684 ASCII \u5c0f\u52a8\u7269\u3002\u5b83\u4e0d\u5e2e\u4f60\u5199\u4ee3\u7801\uff0c\u4e0d\u7ba1\u7406\u4efb\u52a1\uff0c\u751a\u81f3\u4e0d\u80fd\u548c\u4f60\u804a\u5929\u3002\u5b83\u53ea\u662f\u2026\u5728\u90a3\u91cc\u3002</p>
          <h2>\u4e3a\u4ec0\u4e48\u4eba\u4eec\u559c\u6b22\u5b83\uff1f</h2>
          <p>\u56e0\u4e3a\u5b83\u4e0d\u8bd5\u56fe\u6210\u4e3a\u4efb\u4f55\u4e1c\u897f\u3002\u5b83\u4e0d\u88c5\u667a\u80fd\uff0c\u4e0d\u63a8\u8350\u5de5\u5177\uff0c\u4e0d\u641c\u96c6\u6570\u636e\u3002\u5b83\u53ea\u662f\u4e00\u4e2a\u5c0f\u5c0f\u7684\u6570\u5b57\u751f\u547d\uff0c\u5b89\u9759\u5730\u966a\u4f60\u5de5\u4f5c\u3002</p>
          <h2>\u5f53\u5b83\u670d\u6709\u8bb0\u5fc6</h2>
          <p>\u62cd\u62cd\uff08OpenPat\uff09\u628a\u8fd9\u4e2a\u6982\u5ff5\u5411\u524d\u63a8\u4e86\u4e00\u6b65\u3002\u5982\u679c\u4e00\u53ea\u6570\u5b57\u5ba0\u7269\u4e0d\u4ec5\u4f1a\u5728\u90a3\u91cc\uff0c\u8fd8\u80fd\u8bb0\u4f4f\u4f60\u3001\u7406\u89e3\u4f60\u3001\u968f\u7740\u65f6\u95f4\u5f62\u6210\u81ea\u5df1\u7684\u6027\u683c\u5462\uff1f</p>
          <a href="/chat">\u5f00\u59cb\u804a\u5929</a>
          <a href="https://github.com/ma2214889041/OpenPat">Star on GitHub</a>
        </article>
      </div>`,
  },
  {
    path: '/signin',
    file: 'signin/index.html',
    title: '\u767b\u5f55 \u2014 OpenPat',
    description: '\u767b\u5f55 OpenPat\uff0c\u5f00\u59cb\u4f60\u4e0e AI \u4f34\u4fa3\u7684\u65c5\u7a0b\u3002\u7528 GitHub \u6216 Google \u4e00\u952e\u767b\u5f55\u3002',
    canonical: `${BASE_URL}/signin`,
    content: `
      <div class="signin-page">
        <main>
          <h1>\u5f00\u59cb\u4f60\u7684\u65c5\u7a0b</h1>
          <p>\u767b\u5f55\u540e\u53ef\u8de8\u8bbe\u5907\u67e5\u770b\u4f60\u7684\u62cd\u62cd\uff0c\u5e76\u5f00\u542f\u4e13\u5c5e\u516c\u5f00\u72b6\u6001\u9875\u3002</p>
          <p>\u7528 GitHub \u767b\u5f55</p>
          <p>\u7528 Google \u767b\u5f55</p>
          <p>\u4e0d\u9700\u8981\u767b\u5f55\u4e5f\u80fd\u7528 \u2014 <a href="/chat">\u76f4\u63a5\u8fdb\u5165</a></p>
        </main>
      </div>`,
  },
];

// ── Inject helpers ──────────────────────────────────────────────────────────

function replaceTag(html, tag, attr, value) {
  // Replace content="" in meta tags, or text between <tag>...</tag>
  if (attr) {
    const regex = new RegExp(`(<${tag}[^>]*${attr}=")[^"]*(")`);
    return html.replace(regex, `$1${value}$2`);
  }
  const regex = new RegExp(`(<${tag}[^>]*>)[^<]*(</\\s*${tag}>)`);
  return html.replace(regex, `$1${value}$2`);
}

function replaceMetaContent(html, nameOrProp, value) {
  // Matches both name="X" and property="X"
  const regex = new RegExp(
    `(<meta\\s+(?:name|property)="${nameOrProp}"\\s+content=")[^"]*(")`
  );
  return html.replace(regex, `$1${value}$2`);
}

function generate(route) {
  let html = template;

  // Update <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`);

  // Update <meta name="description">
  html = replaceMetaContent(html, 'description', route.description);

  // Update <link rel="canonical">
  html = html.replace(
    /(<link\s+rel="canonical"\s+href=")[^"]*(")/,
    `$1${route.canonical}$2`
  );

  // Update OG tags
  html = replaceMetaContent(html, 'og:title', route.title.split(' \u2014 ')[0]);
  html = replaceMetaContent(html, 'og:description', route.description);
  html = replaceMetaContent(html, 'og:url', route.canonical);

  // Update Twitter tags
  html = replaceMetaContent(html, 'twitter:title', route.title.split(' \u2014 ')[0]);
  html = replaceMetaContent(html, 'twitter:description', route.description);

  // Inject extra <head> content (structured data)
  if (route.extraHead) {
    html = html.replace('</head>', `${route.extraHead}\n</head>`);
  }

  // Inject static HTML into #root
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${route.content}</div>`
  );

  return html;
}

// ── Execute ─────────────────────────────────────────────────────────────────

let count = 0;
for (const route of routes) {
  const outPath = join(DIST, route.file);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, generate(route), 'utf-8');
  count++;
  console.log(`  \u2713 ${route.path} -> dist/${route.file}`);
}

console.log(`\nPrerendered ${count} routes for SEO.\n`);
