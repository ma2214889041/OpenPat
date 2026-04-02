/**
 * GIF share card generator.
 * Captures frames from a rendered pet SVG element and encodes them.
 * Uses gifenc for pure-JS encoding (no native deps).
 */
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { fmt } from './format';

/**
 * Renders the pet SVG string to a canvas frame.
 * @param {string} svgStr - serialized SVG string
 * @param {number} w - width
 * @param {number} h - height
 * @returns {Promise<Uint8ClampedArray>} RGBA pixel data
 */
async function svgToPixels(svgStr, w, h) {
  const blob = new Blob([svgStr], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.width = w;
  img.height = h;
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
    img.src = url;
  });
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  URL.revokeObjectURL(url);
  return ctx.getImageData(0, 0, w, h).data;
}

/**
 * Build SVG string for a given animation frame (t = 0..1).
 * We animate idle antennas + a frame counter for the card.
 */
function buildFrameSVG(stats, skinColors, t) {
  const { primary, secondary } = skinColors;
  const breatheScale = 1 + Math.sin(t * Math.PI * 2) * 0.02;

  const totalTokens = (stats.tokensInput + stats.tokensOutput) || 0;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <!-- Background -->
    <rect width="400" height="400" fill="#080d1a"/>
    <rect width="400" height="400" fill="url(#grad)" opacity="0.3"/>
    <defs>
      <radialGradient id="grad" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="${primary}" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="#080d1a" stop-opacity="0"/>
      </radialGradient>
    </defs>

    <!-- Lobster body group centered -->
    <g transform="translate(200,180)">
      <!-- Body -->
      <ellipse cx="0" cy="0" rx="${42 * breatheScale}" ry="52" fill="${primary}"/>
      <!-- Head -->
      <ellipse cx="0" cy="-50" rx="32" ry="28" fill="${primary}"/>
      <!-- Shell lines -->
      <ellipse cx="0" cy="-12" rx="38" ry="8" fill="${secondary}" opacity="0.5"/>
      <ellipse cx="0" cy="3"  rx="36" ry="7" fill="${secondary}" opacity="0.5"/>
      <!-- Eyes -->
      <circle cx="-16" cy="-60" r="9" fill="white"/>
      <circle cx="16"  cy="-60" r="9" fill="white"/>
      <circle cx="-14" cy="-59" r="5" fill="#1a1a2e"/>
      <circle cx="18"  cy="-59" r="5" fill="#1a1a2e"/>
      <!-- Antennae (animated) -->
      <line x1="-18" y1="-70"
            x2="${-55 + Math.sin(t*Math.PI*2)*8}" y2="${-110 + Math.cos(t*Math.PI*2)*5}"
            stroke="${primary}" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="18" y1="-70"
            x2="${55 - Math.sin(t*Math.PI*2)*8}" y2="${-110 + Math.cos(t*Math.PI*2)*5}"
            stroke="${primary}" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Claws -->
      <line x1="-35" y1="-10" x2="-65" y2="-25" stroke="${primary}" stroke-width="10" stroke-linecap="round"/>
      <ellipse cx="-74" cy="-33" rx="12" ry="7" fill="${primary}" transform="rotate(-20,-74,-33)"/>
      <ellipse cx="-74" cy="-17" rx="12" ry="6" fill="${secondary}" transform="rotate(15,-74,-17)"/>
      <line x1="35" y1="-10" x2="65" y2="-25" stroke="${primary}" stroke-width="10" stroke-linecap="round"/>
      <ellipse cx="74" cy="-33" rx="12" ry="7" fill="${primary}" transform="rotate(20,74,-33)"/>
      <ellipse cx="74" cy="-17" rx="12" ry="6" fill="${secondary}" transform="rotate(-15,74,-17)"/>
      <!-- Tail -->
      <ellipse cx="0" cy="55" rx="22" ry="12" fill="${primary}"/>
      <ellipse cx="-22" cy="58" rx="12" ry="8" fill="${secondary}" transform="rotate(-15,-22,58)"/>
      <ellipse cx="22"  cy="58" rx="12" ry="8" fill="${secondary}" transform="rotate(15,22,58)"/>
    </g>

    <!-- Stats overlay at bottom -->
    <rect x="0" y="310" width="400" height="90" fill="rgba(0,0,0,0.6)"/>
    <text x="20" y="338" font-family="sans-serif" font-size="13" fill="#64748b">Tokens</text>
    <text x="20" y="358" font-family="sans-serif" font-size="20" font-weight="bold" fill="#f1f5f9">${fmt(totalTokens)}</text>
    <text x="160" y="338" font-family="sans-serif" font-size="13" fill="#64748b">工具调用</text>
    <text x="160" y="358" font-family="sans-serif" font-size="20" font-weight="bold" fill="#f1f5f9">${stats.toolCalls}</text>
    <text x="280" y="338" font-family="sans-serif" font-size="13" fill="#64748b">成功率</text>
    <text x="280" y="358" font-family="sans-serif" font-size="20" font-weight="bold" fill="#22c55e">${stats.toolCalls > 0 ? ((stats.toolCallsSuccess / stats.toolCalls) * 100).toFixed(0) + '%' : '—'}</text>
    <text x="200" y="392" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#334155">🐾 open-pat.com · npx open-pat</text>
  </svg>`;
}

/**
 * Load an image URL onto an OffscreenCanvas and return pixel data.
 */
async function imageUrlToPixels(url, w, h) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
    img.src = url;
  });
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d');
  // Dark background
  ctx.fillStyle = '#080d1a';
  ctx.fillRect(0, 0, w, h);
  // Center the pet frame
  const petSize = Math.round(w * 0.6);
  const offset = (w - petSize) / 2;
  ctx.drawImage(img, offset, Math.round(h * 0.05), petSize, petSize);
  // Stats bar
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, h - 90, w, 90);
  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = '#f1f5f9';
  const totalTokens = (stats.tokensInput + stats.tokensOutput) || 0;
  ctx.fillText(fmt(totalTokens), 20, h - 55);
  ctx.fillText(stats.toolCalls, 160, h - 55);
  ctx.fillStyle = '#22c55e';
  ctx.fillText(
    stats.toolCalls > 0 ? ((stats.toolCallsSuccess / stats.toolCalls) * 100).toFixed(0) + '%' : '—',
    280, h - 55,
  );
  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Tokens', 20, h - 72);
  ctx.fillText('工具调用', 160, h - 72);
  ctx.fillText('成功率', 280, h - 72);
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('🐾 open-pat.com', w / 2 - 40, h - 10);
  return ctx.getImageData(0, 0, w, h).data;
}

/**
 * Generate an animated GIF share card.
 *
 * @param {object}   stats         - session stats
 * @param {object}   skinColors    - { primary, secondary } (SVG fallback)
 * @param {string[]|null} petFrameUrls - PNG data URLs from animated skin (takes priority)
 * @param {number}   [delay=120]   - ms per frame
 * @returns {Promise<Blob>} GIF blob
 */
export async function generateGifCard(
  stats,
  skinColors = { primary: '#e8401c', secondary: '#c83010' },
  petFrameUrls = null,
  delay = 120,
) {
  const W = 400, H = 400;
  const gif = GIFEncoder();

  if (petFrameUrls?.length) {
    // Use AI-generated PNG frames
    for (const url of petFrameUrls) {
      const pixels = await imageUrlToPixels(url, W, H);
      const palette = quantize(pixels, 256, { format: 'rgb565', oneBitAlpha: false });
      const index = applyPalette(pixels, palette);
      gif.writeFrame(index, W, H, { palette, delay });
    }
  } else {
    // Fallback: generate SVG animation
    const frames = 16;
    for (let i = 0; i < frames; i++) {
      const t = i / frames;
      const svgStr = buildFrameSVG(stats, skinColors, t);
      const pixels = await svgToPixels(svgStr, W, H);
      const palette = quantize(pixels, 256, { format: 'rgb565', oneBitAlpha: false });
      const index = applyPalette(pixels, palette);
      gif.writeFrame(index, W, H, { palette, delay: 80 });
    }
  }

  gif.finish();
  return new Blob([gif.bytes()], { type: 'image/gif' });
}
