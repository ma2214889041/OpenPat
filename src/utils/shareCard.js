import { toPng } from 'html-to-image';

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function pickTemplate(stats, status) {
  if (status === 'error') return 'crash';
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 5) return 'night';
  const total = stats.tokensInput + stats.tokensOutput;
  if (total > 100_000) return 'bill';
  if (stats.toolCalls > 0 && stats.toolCallsSuccess === stats.toolCalls) return 'highlight';
  return 'battle_report';
}

// Token → human-readable analogy (the funnier the better)
function tokenAnalogy(total) {
  if (total >= 5_000_000) return `${fmt(total)} tokens — 够写一部长篇小说了`;
  if (total >= 1_000_000) return `${fmt(total)} tokens — 相当于把《三体》读了两遍`;
  if (total >= 500_000)   return `${fmt(total)} tokens — 够写一篇博士论文了`;
  if (total >= 100_000)   return `${fmt(total)} tokens — 相当于一整本书的算力`;
  if (total >= 50_000)    return `${fmt(total)} tokens — 比你今天说的话还多`;
  if (total >= 10_000)    return `${fmt(total)} tokens — 够写好几篇作文了`;
  if (total >= 1_000)     return `${fmt(total)} tokens — 刚刚热身`;
  return `${fmt(total)} tokens`;
}

const TEMPLATES = {
  battle_report: {
    title: '龙虾战报',
    headline: (s) => {
      const rate = s.toolCalls > 0 ? ((s.toolCallsSuccess / s.toolCalls) * 100).toFixed(0) : 100;
      if (s.toolCalls === 0) return `安静地思考中，一个工具都没动 🤔`;
      if (rate === '100') return `调用了 ${s.toolCalls} 次工具，成功率 100%，零翻车 🎉`;
      return `调用了 ${s.toolCalls} 次工具，翻了 ${s.toolCalls - s.toolCallsSuccess} 次车，但还在战斗 💪`;
    },
    bg: '#FFE780', accent: '#000', tag: '#000',
  },
  highlight: {
    title: '高光时刻',
    headline: (s) => {
      const total = s.tokensInput + s.tokensOutput;
      if (total > 0) return `零翻车之王 — ${tokenAnalogy(total)} ⚡`;
      return '零翻车之王，今天是效率满分的一天 ⚡';
    },
    bg: '#83FFC1', accent: '#000', tag: '#000',
  },
  crash: {
    title: '翻车现场',
    headline: (s) => `被报错拦了 ${Math.max(0, s.toolCalls - s.toolCallsSuccess)} 次还在爬起来，比我坚强`,
    bg: '#FF94DB', accent: '#000', tag: '#000',
  },
  night: {
    title: '深夜加班',
    headline: (s) => {
      const total = s.tokensInput + s.tokensOutput;
      const base = `凌晨 ${new Date().getHours()} 点还在工作，人类已经睡了 🌙`;
      return total > 10_000 ? `${base}  |  ${tokenAnalogy(total)}` : base;
    },
    bg: '#8B8BFF', accent: '#000', tag: '#000',
  },
  bill: {
    title: '账单龙虾',
    headline: (s) => tokenAnalogy(s.tokensInput + s.tokensOutput) + ' ☕',
    bg: '#FFE780', accent: '#000', tag: '#000',
  },
};

// ─── Meme share card ─────────────────────────────────────────────────────────
// Full-bleed meme image with gradient overlay + caption + username

export async function generateMemeShareCard({ memeImageUrl, caption, username, profileUrl = 'openp.at', format = '4x5' } = {}) {
  const is1x1 = format === '1x1';
  const width = 1080;
  const height = is1x1 ? 1080 : 1350;

  const el = document.createElement('div');
  el.style.cssText = `
    width:${width}px; height:${height}px;
    font-family:'Nunito',system-ui,sans-serif;
    position:relative; overflow:hidden;
    background:#111;
  `;

  const memeHtml = memeImageUrl
    ? `<img src="${memeImageUrl}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />`
    : `<div style="position:absolute;inset:0;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);"></div>`;

  el.innerHTML = `
    ${memeHtml}

    <!-- gradient overlay bottom half -->
    <div style="position:absolute;bottom:0;left:0;right:0;height:60%;
      background:linear-gradient(to top,rgba(0,0,0,0.96) 0%,rgba(0,0,0,0.75) 40%,transparent 100%);
      pointer-events:none;"></div>

    <!-- OpenPat badge top-left -->
    <div style="position:absolute;top:${is1x1 ? 60 : 72}px;left:${is1x1 ? 60 : 80}px;
      background:rgba(0,0,0,0.6);backdrop-filter:blur(10px);
      color:#fff;padding:10px 26px;border-radius:9999px;
      font-size:${is1x1 ? 26 : 30}px;font-weight:900;letter-spacing:-0.01em;
      border:1.5px solid rgba(255,255,255,0.18);
      font-family:'Syne',system-ui,sans-serif;">
      OpenPat
    </div>

    <!-- Bottom content -->
    <div style="position:absolute;bottom:0;left:0;right:0;
      padding:${is1x1 ? 56 : 68}px ${is1x1 ? 60 : 80}px;
      display:flex;flex-direction:column;gap:${is1x1 ? 20 : 28}px;">

      <!-- Caption -->
      <div style="font-size:${is1x1 ? 48 : 56}px;font-weight:900;color:#fff;
        line-height:1.2;letter-spacing:-0.03em;
        text-shadow:0 4px 24px rgba(0,0,0,0.6);
        font-family:'Syne',system-ui,sans-serif;
        max-width:920px;word-break:break-all;">
        ${caption || '我的 Agent 正在工作中'}
      </div>

      <!-- Username + URL row -->
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="background:rgba(255,255,255,0.14);backdrop-filter:blur(8px);
          color:#fff;padding:12px 28px;border-radius:9999px;
          font-size:${is1x1 ? 24 : 28}px;font-weight:700;
          border:1.5px solid rgba(255,255,255,0.22);">
          @${username || 'agent'}
        </div>
        <div style="font-size:${is1x1 ? 20 : 24}px;font-weight:600;color:rgba(255,255,255,0.45);">
          ${profileUrl}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(el);
  try {
    const dataUrl = await toPng(el, { width, height, pixelRatio: 1 });
    return dataUrl;
  } finally {
    document.body.removeChild(el);
  }
}

// ─── Achievement share card ───────────────────────────────────────────────────

const RARITY_CARD_STYLES = {
  common:    { bg: '#1e293b', accent: '#94a3b8', glow: 'rgba(148,163,184,0.3)',  label: '普通成就' },
  rare:      { bg: '#1e3a5f', accent: '#60a5fa', glow: 'rgba(96,165,250,0.35)', label: '稀有成就' },
  epic:      { bg: '#2e1065', accent: '#a78bfa', glow: 'rgba(167,139,250,0.4)', label: '史诗成就' },
  legendary: { bg: '#451a03', accent: '#fbbf24', glow: 'rgba(251,191,36,0.45)', label: '传说成就' },
};

export async function generateAchievementShareCard({ achievement, username, profileUrl = 'openp.at', format = '4x5' } = {}) {
  const is1x1 = format === '1x1';
  const width = 1080;
  const height = is1x1 ? 1080 : 1350;

  const rarity = achievement?.rarity ?? 'common';
  const style = RARITY_CARD_STYLES[rarity] ?? RARITY_CARD_STYLES.common;
  const iconHtml = achievement?.icon_unlocked
    ? `<img src="${achievement.icon_unlocked}" style="width:${is1x1 ? 140 : 160}px;height:${is1x1 ? 140 : 160}px;object-fit:contain;" />`
    : `<span style="font-size:${is1x1 ? 120 : 140}px;line-height:1;">${achievement?.emoji ?? '🏆'}</span>`;

  const el = document.createElement('div');
  el.style.cssText = `
    width:${width}px; height:${height}px;
    background:${style.bg};
    font-family:'Nunito',system-ui,sans-serif;
    position:relative; overflow:hidden;
    display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    padding:${is1x1 ? 80 : 100}px;
    box-sizing:border-box;
  `;

  el.innerHTML = `
    <!-- Background radial glow -->
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
      width:700px;height:700px;border-radius:50%;
      background:radial-gradient(circle, ${style.glow} 0%, transparent 70%);
      pointer-events:none;"></div>

    <!-- Dot pattern -->
    <div style="position:absolute;inset:0;opacity:0.04;
      background-image:radial-gradient(circle,#fff 1.5px,transparent 1.5px);
      background-size:32px 32px;pointer-events:none;"></div>

    <!-- Top bar -->
    <div style="position:absolute;top:${is1x1 ? 60 : 72}px;left:${is1x1 ? 80 : 100}px;right:${is1x1 ? 80 : 100}px;
      display:flex;align-items:center;justify-content:space-between;">
      <div style="color:rgba(255,255,255,0.5);
        font-size:${is1x1 ? 26 : 30}px;font-weight:900;letter-spacing:-0.01em;
        font-family:'Syne',system-ui,sans-serif;">
        OpenPat
      </div>
      <div style="background:${style.accent};color:#000;
        padding:8px 22px;border-radius:9999px;
        font-size:${is1x1 ? 22 : 26}px;font-weight:800;letter-spacing:0.02em;">
        ${style.label}解锁
      </div>
    </div>

    <!-- Icon -->
    <div style="margin-bottom:${is1x1 ? 28 : 36}px;
      filter:drop-shadow(0 0 40px ${style.glow});">
      ${iconHtml}
    </div>

    <!-- Name -->
    <div style="font-family:'Syne',system-ui,sans-serif;
      font-size:${is1x1 ? 64 : 76}px;font-weight:900;
      color:#fff;letter-spacing:-0.03em;
      margin-bottom:${is1x1 ? 20 : 24}px;text-align:center;">
      ${achievement?.name ?? '成就解锁'}
    </div>

    <!-- Unlock caption (funny text) -->
    <div style="font-size:${is1x1 ? 30 : 34}px;font-weight:600;
      color:rgba(255,255,255,0.65);text-align:center;line-height:1.5;
      max-width:${is1x1 ? 820 : 860}px;margin-bottom:${is1x1 ? 48 : 64}px;">
      ${achievement?.share_caption ?? achievement?.desc ?? ''}
    </div>

    <!-- Bottom row -->
    <div style="position:absolute;bottom:${is1x1 ? 60 : 72}px;
      left:${is1x1 ? 80 : 100}px;right:${is1x1 ? 80 : 100}px;
      display:flex;align-items:center;justify-content:space-between;">
      <div style="background:rgba(255,255,255,0.1);
        color:#fff;padding:12px 28px;border-radius:9999px;
        font-size:${is1x1 ? 24 : 28}px;font-weight:700;
        border:1.5px solid rgba(255,255,255,0.15);">
        @${username || 'agent'}
      </div>
      <div style="font-size:${is1x1 ? 20 : 24}px;font-weight:600;
        color:rgba(255,255,255,0.35);">
        ${profileUrl}
      </div>
    </div>
  `;

  document.body.appendChild(el);
  try {
    const dataUrl = await toPng(el, { width, height, pixelRatio: 1 });
    return dataUrl;
  } finally {
    document.body.removeChild(el);
  }
}

export async function generateShareCard(stats, status, format = '4x5', _skinColors, petFrameUrl = null) {
  const tmplKey = pickTemplate(stats, status);
  const tmpl = TEMPLATES[tmplKey];
  const is1x1 = format === '1x1';
  const width = 1080;
  const height = is1x1 ? 1080 : 1350;

  const successRate = stats.toolCalls > 0
    ? ((stats.toolCallsSuccess / stats.toolCalls) * 100).toFixed(0) + '%'
    : '100%';

  const petImg = petFrameUrl
    ? `<img src="${petFrameUrl}" style="width:${is1x1 ? 220 : 260}px;height:${is1x1 ? 220 : 260}px;object-fit:contain;" />`
    : `<div style="width:${is1x1 ? 220 : 260}px;height:${is1x1 ? 220 : 260}px;display:flex;align-items:center;justify-content:center;font-size:120px;">🦞</div>`;

  const el = document.createElement('div');
  el.style.cssText = `
    width:${width}px; height:${height}px;
    background:${tmpl.bg};
    font-family:'Nunito',system-ui,sans-serif;
    position:relative; overflow:hidden;
    display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    padding:${is1x1 ? 80 : 100}px;
    box-sizing:border-box;
    color:#000;
  `;

  el.innerHTML = `
    <!-- Background dots pattern -->
    <div style="position:absolute;inset:0;opacity:0.06;
      background-image:radial-gradient(circle,#000 1.5px,transparent 1.5px);
      background-size:32px 32px;pointer-events:none;"></div>

    <!-- Top bar -->
    <div style="position:absolute;top:${is1x1 ? 60 : 72}px;left:${is1x1 ? 80 : 100}px;right:${is1x1 ? 80 : 100}px;
      display:flex;align-items:center;justify-content:space-between;">
      <div style="background:#000;color:${tmpl.bg};padding:8px 22px;border-radius:9999px;
        font-size:${is1x1 ? 26 : 30}px;font-weight:900;letter-spacing:-0.01em;
        font-family:'Syne',system-ui,sans-serif;">
        OpenPat
      </div>
      <div style="background:rgba(0,0,0,0.12);padding:8px 20px;border-radius:9999px;
        font-size:${is1x1 ? 22 : 26}px;font-weight:800;letter-spacing:0.02em;">
        ${tmpl.title}
      </div>
    </div>

    <!-- Pet image -->
    <div style="margin-bottom:${is1x1 ? 32 : 40}px;filter:drop-shadow(0 20px 40px rgba(0,0,0,0.15));">
      ${petImg}
    </div>

    <!-- Headline -->
    <h2 style="font-family:'Syne',system-ui,sans-serif;
      font-size:${is1x1 ? 46 : 54}px;font-weight:800;
      text-align:center;line-height:1.2;
      letter-spacing:-0.03em;
      color:#000;margin:0 0 ${is1x1 ? 40 : 56}px;
      max-width:${is1x1 ? 800 : 860}px;">
      ${tmpl.headline(stats)}
    </h2>

    <!-- Stats row -->
    <div style="display:flex;gap:${is1x1 ? 16 : 20}px;justify-content:center;margin-bottom:${is1x1 ? 48 : 64}px;">
      ${[
        [fmt(stats.tokensInput + stats.tokensOutput), 'Tokens'],
        [stats.toolCalls, '工具调用'],
        [successRate, '成功率'],
      ].map(([val, label]) => `
        <div style="background:rgba(0,0,0,0.1);border-radius:20px;
          padding:${is1x1 ? 24 : 32}px ${is1x1 ? 32 : 44}px;text-align:center;">
          <div style="font-size:${is1x1 ? 44 : 52}px;font-weight:900;
            font-family:'Syne',system-ui,sans-serif;letter-spacing:-0.03em;line-height:1;">
            ${val}
          </div>
          <div style="font-size:${is1x1 ? 20 : 24}px;font-weight:600;
            color:rgba(0,0,0,0.5);margin-top:6px;">
            ${label}
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Bottom CTA -->
    <div style="position:absolute;bottom:${is1x1 ? 60 : 72}px;
      display:flex;align-items:center;gap:16px;">
      <div style="background:#000;color:${tmpl.bg};
        padding:14px 32px;border-radius:9999px;
        font-size:${is1x1 ? 24 : 28}px;font-weight:900;
        font-family:'Courier New',monospace;letter-spacing:0.01em;">
        npx openpat
      </div>
      <div style="font-size:${is1x1 ? 22 : 26}px;font-weight:700;color:rgba(0,0,0,0.45);">
        openpat.dev
      </div>
    </div>
  `;

  document.body.appendChild(el);
  try {
    const dataUrl = await toPng(el, { width, height, pixelRatio: 1 });
    return dataUrl;
  } finally {
    document.body.removeChild(el);
  }
}
