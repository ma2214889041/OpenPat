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
    headline: () => '零翻车之王，今天是效率满分的一天 ⚡',
    bg: '#83FFC1', accent: '#000', tag: '#000',
  },
  crash: {
    title: '翻车现场',
    headline: (s) => `被报错拦了 ${Math.max(0, s.toolCalls - s.toolCallsSuccess)} 次还在爬起来，比我坚强`,
    bg: '#FF94DB', accent: '#000', tag: '#000',
  },
  night: {
    title: '深夜加班',
    headline: () => `凌晨 ${new Date().getHours()} 点还在工作，人类已经睡了 🌙`,
    bg: '#8B8BFF', accent: '#000', tag: '#000',
  },
  bill: {
    title: '账单龙虾',
    headline: (s) => {
      const total = fmt(s.tokensInput + s.tokensOutput);
      return `今天吃了 ${total} Tokens，相当于半杯咖啡的算力 ☕`;
    },
    bg: '#FFE780', accent: '#000', tag: '#000',
  },
};

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
