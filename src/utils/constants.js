/**
 * Shared constants: status colors, labels, captions, localStorage keys.
 * Single source of truth — import from here instead of redefining.
 */
import { STATES } from './states';

// ── Status colors (unified, used by StatsPanel + PublicProfile + badge) ────
export const STATUS_COLORS = {
  [STATES.OFFLINE]:         '#94a3b8',
  [STATES.IDLE]:            '#22c55e',
  [STATES.THINKING]:        '#f59e0b',
  [STATES.TOOL_CALL]:       '#3b82f6',
  [STATES.DONE]:            '#10b981',
  [STATES.ERROR]:           '#ef4444',
  [STATES.TOKEN_EXHAUSTED]: '#f97316',
};

// ── Status labels (Chinese) ────────────────────────────────────────────────
export const STATUS_LABELS = {
  [STATES.OFFLINE]:         '离线',
  [STATES.IDLE]:            '空闲',
  [STATES.THINKING]:        '思考中',
  [STATES.TOOL_CALL]:       '调用中',
  [STATES.DONE]:            '完成',
  [STATES.ERROR]:           '报错',
  [STATES.TOKEN_EXHAUSTED]: 'Token耗尽',
};

// ── Status text (longer, for PublicProfile) ────────────────────────────────
export const STATUS_TEXT = {
  [STATES.OFFLINE]:         '离线中',
  [STATES.IDLE]:            '待命中',
  [STATES.THINKING]:        '思考中...',
  [STATES.TOOL_CALL]:       '调用工具中 ⚡',
  [STATES.DONE]:            '任务完成 ✓',
  [STATES.ERROR]:           '发生错误',
  [STATES.TOKEN_EXHAUSTED]: 'Token 耗尽',
};

// ── Default meme captions (used by Home + PublicProfile meme share) ────────
export const DEFAULT_CAPTIONS = {
  idle:            '摸鱼中。不打扰它。',
  thinking:        '它在思考，就像你不会的那些事。',
  tool_call:       '正在调用工具。这活儿你不想自己做，它替你扛着。',
  done:            '搞定了。下一个。',
  error:           '翻车了，但还在爬。',
  offline:         '下线了。明天见。',
  token_exhausted: '没 Token 了。账单来了吗？',
  happy:           '今天心情不错，继续干。',
};

// ── localStorage keys ─────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  APP_DATA:            'openpat-data',
  GATEWAY_CONNECTION:  'openpat-connection',
  ACTIVE_SKIN:         'openpat-active-skin',
  ACTIVE_ANIMATED_SKIN:'openpat-active-animated-skin',
  DEVICE_KEY:          'openpat-device-v1',
  DEVICE_TOKEN:        'openpat-device-token-v1',
};
