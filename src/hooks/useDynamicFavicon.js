import { useEffect } from 'react';
import { STATES } from './useGateway';

// Status → emoji char for favicon
const STATUS_EMOJI = {
  [STATES.OFFLINE]:         '😴',
  [STATES.IDLE]:            '🦞',
  [STATES.THINKING]:        '🤔',
  [STATES.TOOL_CALL]:       '⚡',
  [STATES.DONE]:            '✅',
  [STATES.ERROR]:           '❌',
  [STATES.TOKEN_EXHAUSTED]: '💸',
};

// Status → badge color overlay for the favicon
const STATUS_BG = {
  [STATES.OFFLINE]:         '#475569',
  [STATES.IDLE]:            '#080d1a',
  [STATES.THINKING]:        '#f59e0b',
  [STATES.TOOL_CALL]:       '#3b82f6',
  [STATES.DONE]:            '#22c55e',
  [STATES.ERROR]:           '#ef4444',
  [STATES.TOKEN_EXHAUSTED]: '#f97316',
};

let faviconEl = null;

function getFaviconEl() {
  if (faviconEl) return faviconEl;
  faviconEl = document.querySelector('link[rel~="icon"]');
  if (!faviconEl) {
    faviconEl = document.createElement('link');
    faviconEl.rel = 'icon';
    document.head.appendChild(faviconEl);
  }
  return faviconEl;
}

function buildFaviconSVG(status) {
  const emoji = STATUS_EMOJI[status] || '🦞';
  const bg = STATUS_BG[status] || '#080d1a';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="8" fill="${bg}" opacity="${status === STATES.IDLE ? '0' : '0.85'}"/>
    <text y="26" font-size="26" font-family="serif">${emoji}</text>
  </svg>`;
}

export function useDynamicFavicon(status) {
  useEffect(() => {
    const svg = buildFaviconSVG(status);
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    const el = getFaviconEl();
    el.type = 'image/svg+xml';
    el.href = dataUrl;
  }, [status]);
}
