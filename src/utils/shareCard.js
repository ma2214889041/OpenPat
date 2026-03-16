import { toPng } from 'html-to-image';
import QRCode from 'qrcode';

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function estimateUsd(tokensInput, tokensOutput) {
  const usd = (tokensInput * 3 + tokensOutput * 15) / 1_000_000;
  return usd.toFixed(2);
}

function pickTemplate(stats, status) {
  if (status === 'error') return 'crash';
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 5) return 'night';
  const total = stats.tokensInput + stats.tokensOutput;
  if (total > 100_000) return 'bill';
  if (stats.toolCalls > 0 && stats.toolCallsSuccess === stats.toolCalls) return 'highlight';
  return 'battle_report'; // default: 龙虾战报
}

const TEMPLATES = {
  battle_report: {
    title: '龙虾战报',
    headline: (s) => {
      const rate = s.toolCalls > 0 ? ((s.toolCallsSuccess / s.toolCalls) * 100).toFixed(0) : 100;
      const usd = estimateUsd(s.tokensInput, s.tokensOutput);
      if (s.toolCalls === 0) return `你的龙虾今天在安静地思考，连一个工具都没动 🤔`;
      if (rate === '100') return `你的龙虾今天调用了 ${s.toolCalls} 次工具，成功率 100%，零翻车。花了 $${usd}，比一颗糖还便宜 🎉`;
      return `你的龙虾今天调用了 ${s.toolCalls} 次工具，成功率 ${rate}%，翻了 ${s.toolCalls - s.toolCallsSuccess} 次车，但它还在战斗 💪`;
    },
    accent: '#e8401c',
  },
  daily: {
    title: '日报',
    headline: s => `我的赛博龙虾今天调用了 ${s.toolCalls} 次工具，成功率 ${s.toolCalls > 0 ? ((s.toolCallsSuccess / s.toolCalls) * 100).toFixed(1) : 100}%`,
    accent: '#e8401c',
  },
  highlight: {
    title: '高光时刻',
    headline: () => '龙虾今天是效率之神 ⚡ 零翻车之王！',
    accent: '#22c55e',
  },
  crash: {
    title: '翻车现场',
    headline: s => `被报错拦了 ${Math.max(0, s.toolCalls - s.toolCallsSuccess)} 次还在爬起来，比我坚强`,
    accent: '#ef4444',
  },
  night: {
    title: '深夜加班',
    headline: () => `凌晨 ${new Date().getHours()} 点龙虾还在加班，人类已经睡了`,
    accent: '#8b5cf6',
  },
  bill: {
    title: '账单龙虾',
    headline: s => {
      const usd = estimateUsd(s.tokensInput, s.tokensOutput);
      return `龙虾今天吃了 ${fmt(s.tokensInput + s.tokensOutput)} Tokens，花了 $${usd}，相当于半杯咖啡`;
    },
    accent: '#f59e0b',
  },
};

function lobsterSVG(size, primary = '#e8401c', secondary = '#c83010') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" width="${size}" height="${size * 1.1}" style="overflow:visible">
    <ellipse cx="100" cy="130" rx="42" ry="52" fill="${primary}"/>
    <ellipse cx="100" cy="80" rx="32" ry="28" fill="${primary}"/>
    <ellipse cx="100" cy="118" rx="38" ry="8" fill="${secondary}" opacity="0.6"/>
    <ellipse cx="100" cy="133" rx="36" ry="7" fill="${secondary}" opacity="0.6"/>
    <ellipse cx="100" cy="147" rx="33" ry="7" fill="${secondary}" opacity="0.6"/>
    <circle cx="84" cy="70" r="9" fill="white"/>
    <circle cx="116" cy="70" r="9" fill="white"/>
    <circle cx="86" cy="71" r="5" fill="#1a1a2e"/>
    <circle cx="118" cy="71" r="5" fill="#1a1a2e"/>
    <circle cx="88" cy="69" r="2" fill="white"/>
    <circle cx="120" cy="69" r="2" fill="white"/>
    <line x1="82" y1="60" x2="55" y2="20" stroke="${primary}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="118" y1="60" x2="145" y2="20" stroke="${primary}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="65" y1="110" x2="35" y2="95" stroke="${primary}" stroke-width="10" stroke-linecap="round"/>
    <ellipse cx="26" cy="87" rx="12" ry="7" fill="${primary}" transform="rotate(-20,26,87)"/>
    <ellipse cx="26" cy="103" rx="12" ry="6" fill="${secondary}" transform="rotate(15,26,103)"/>
    <line x1="135" y1="110" x2="165" y2="95" stroke="${primary}" stroke-width="10" stroke-linecap="round"/>
    <ellipse cx="174" cy="87" rx="12" ry="7" fill="${primary}" transform="rotate(20,174,87)"/>
    <ellipse cx="174" cy="103" rx="12" ry="6" fill="${secondary}" transform="rotate(-15,174,103)"/>
    <line x1="70" y1="145" x2="50" y2="172" stroke="${primary}" stroke-width="3" stroke-linecap="round"/>
    <line x1="72" y1="155" x2="48" y2="180" stroke="${primary}" stroke-width="3" stroke-linecap="round"/>
    <line x1="130" y1="145" x2="150" y2="172" stroke="${primary}" stroke-width="3" stroke-linecap="round"/>
    <line x1="128" y1="155" x2="152" y2="180" stroke="${primary}" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="100" cy="185" rx="22" ry="12" fill="${primary}"/>
    <ellipse cx="78" cy="188" rx="12" ry="8" fill="${secondary}" transform="rotate(-15,78,188)"/>
    <ellipse cx="122" cy="188" rx="12" ry="8" fill="${secondary}" transform="rotate(15,122,188)"/>
  </svg>`;
}

// format: '4x5' (1080x1350 default) or '1x1' (1080x1080)
export async function generateShareCard(stats, status, format = '4x5', skinColors = { primary: '#e8401c', secondary: '#c83010' }) {
  const tmplKey = pickTemplate(stats, status);
  const tmpl = TEMPLATES[tmplKey];
  const is1x1 = format === '1x1';
  const width = 1080;
  const height = is1x1 ? 1080 : 1350;
  const lobsterSize = is1x1 ? 200 : 240;

  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL('https://openpat.dev', {
      width: 150, margin: 1,
      color: { dark: '#ffffff', light: '#00000000' },
    });
  } catch { /* qr optional */ }

  const successRate = stats.toolCalls > 0
    ? ((stats.toolCallsSuccess / stats.toolCalls) * 100).toFixed(1) + '%'
    : '—';

  const el = document.createElement('div');
  el.style.cssText = `
    width:${width}px; height:${height}px;
    background: linear-gradient(145deg, #080d1a 0%, #0f172a 50%, #080d1a 100%);
    font-family: -apple-system,'PingFang SC','Noto Sans SC',sans-serif;
    position: relative; overflow: hidden;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: ${is1x1 ? 64 : 80}px;
    box-sizing: border-box;
    color: #f1f5f9;
  `;

  const svgEncoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(lobsterSVG(lobsterSize, skinColors.primary, skinColors.secondary))}`;
  const fs = is1x1
    ? { badge: 22, h2: 44, stat: 26, statVal: 36, cta: 20, ctaCode: 24 }
    : { badge: 28, h2: 50, stat: 30, statVal: 44, cta: 24, ctaCode: 28 };

  el.innerHTML = `
    <div style="position:absolute;top:-200px;left:-200px;width:700px;height:700px;border-radius:50%;
      background:radial-gradient(circle,${tmpl.accent}20 0%,transparent 70%);pointer-events:none;"></div>
    <div style="position:absolute;bottom:-100px;right:-100px;width:500px;height:500px;border-radius:50%;
      background:radial-gradient(circle,${tmpl.accent}15 0%,transparent 70%);pointer-events:none;"></div>

    <div style="position:absolute;top:${is1x1?50:64}px;left:${is1x1?64:80}px;
      background:${tmpl.accent};color:white;padding:6px 18px;border-radius:20px;
      font-size:${fs.badge}px;font-weight:700;letter-spacing:0.05em;">${tmpl.title}</div>

    <img src="${svgEncoded}" width="${lobsterSize}" height="${Math.round(lobsterSize*1.1)}"
      style="filter:drop-shadow(0 20px 60px ${tmpl.accent}66);margin-bottom:32px;" />

    <h2 style="font-size:${fs.h2}px;font-weight:800;text-align:center;margin:0 0 ${is1x1?36:48}px;
      line-height:1.35;max-width:860px;color:#f1f5f9;">${tmpl.headline(stats)}</h2>

    <div style="display:flex;gap:${is1x1?28:40}px;flex-wrap:wrap;justify-content:center;margin-bottom:${is1x1?48:60}px;">
      ${[
        ['🔢', fmt(stats.tokensInput + stats.tokensOutput), 'Tokens'],
        ['🛠', stats.toolCalls, '工具调用'],
        ['✅', successRate, '成功率'],
      ].map(([emoji, val, label]) => `
        <div style="text-align:center;padding:${is1x1?20:30}px ${is1x1?26:40}px;
          background:rgba(255,255,255,0.04);border-radius:16px;border:1px solid rgba(255,255,255,0.08);">
          <div style="font-size:${fs.stat}px;margin-bottom:8px;">${emoji}</div>
          <div style="font-size:${fs.statVal}px;font-weight:800;">${val}</div>
          <div style="font-size:${is1x1?16:20}px;color:#64748b;margin-top:4px;">${label}</div>
        </div>`).join('')}
    </div>

    <div style="position:absolute;bottom:${is1x1?48:60}px;left:${is1x1?64:80}px;right:${is1x1?64:80}px;
      display:flex;align-items:flex-end;justify-content:space-between;">
      <div>
        <div style="font-size:${fs.cta}px;color:#64748b;margin-bottom:8px;">跑一行代码，领养你的赛博龙虾：</div>
        <div style="font-size:${fs.ctaCode}px;color:${tmpl.accent};font-family:monospace;font-weight:700;
          background:rgba(255,255,255,0.04);padding:10px 20px;border-radius:10px;
          border:1px solid ${tmpl.accent}44;">npx openpat</div>
      </div>
      ${qrDataUrl ? `
        <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:12px;border:1px solid rgba(255,255,255,0.1);">
          <img src="${qrDataUrl}" width="${is1x1?130:150}" height="${is1x1?130:150}" />
          <div style="font-size:14px;color:#475569;text-align:center;margin-top:6px;">openpat.dev</div>
        </div>` : ''}
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
