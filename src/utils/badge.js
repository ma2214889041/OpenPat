/**
 * Generate a GitHub README SVG badge for the user's lobster.
 * Usage: embed as <img src="https://lobster.pet/badge/:username.svg">
 * This file generates the SVG string for local preview.
 */

import { LEVELS, getLevel } from './storage';

const STATUS_COLORS = {
  idle: '#22c55e',
  thinking: '#f59e0b',
  tool_call: '#3b82f6',
  done: '#10b981',
  error: '#ef4444',
  token_exhausted: '#f97316',
  offline: '#64748b',
};

const STATUS_LABELS = {
  idle: 'idle',
  thinking: 'thinking...',
  tool_call: 'working',
  done: 'done ✔',
  error: 'error',
  token_exhausted: 'empty',
  offline: 'offline',
};

/**
 * Generate SVG badge markup.
 * @param {string} username
 * @param {string} status
 * @param {number} totalTasks
 * @returns {string} SVG string
 */
export function generateBadgeSVG(username, status = 'offline', totalTasks = 0) {
  const levelIdx = getLevel(totalTasks);
  const level = LEVELS[levelIdx];
  const color = STATUS_COLORS[status] || STATUS_COLORS.offline;
  const label = STATUS_LABELS[status] || 'offline';

  const leftText = `🦞 ${username} (${level.name})`;
  const rightText = label;

  // Estimate widths
  const leftW = leftText.length * 7 + 16;
  const rightW = rightText.length * 7 + 16;
  const totalW = leftW + rightW;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="20">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalW}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${leftW}" height="20" fill="#555"/>
    <rect x="${leftW}" width="${rightW}" height="20" fill="${color}"/>
    <rect width="${totalW}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="110">
    <text x="${(leftW / 2 + 1) * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(leftW - 10) * 10}" lengthAdjust="spacing">${leftText}</text>
    <text x="${(leftW / 2) * 10}" y="140" transform="scale(.1)" textLength="${(leftW - 10) * 10}" lengthAdjust="spacing">${leftText}</text>
    <text x="${(leftW + rightW / 2 + 1) * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(rightW - 10) * 10}" lengthAdjust="spacing">${rightText}</text>
    <text x="${(leftW + rightW / 2) * 10}" y="140" transform="scale(.1)" textLength="${(rightW - 10) * 10}" lengthAdjust="spacing">${rightText}</text>
  </g>
</svg>`;
}

/**
 * Download badge SVG as a file.
 */
export function downloadBadge(username, status, totalTasks) {
  const svg = generateBadgeSVG(username, status, totalTasks);
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lobster-badge-${username}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Returns a markdown snippet for embedding in README.
 */
export function getBadgeMarkdown(username) {
  return `[![Lobster Pet](https://lobster.pet/badge/${username}.svg)](https://lobster.pet/u/${username})`;
}
