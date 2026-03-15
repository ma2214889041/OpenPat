const STORAGE_KEY = 'lobster-pet-data';

const defaultData = {
  totalTasks: 0,
  totalToolCalls: 0,
  totalTokensInput: 0,
  totalTokensOutput: 0,
  achievements: [],
  level: 0,
  sessionStart: null,
  todayTokensInput: 0,
  todayTokensOutput: 0,
  todayDate: null,
  // marathon tracking
  firstConnectedAt: null,       // timestamp of first ever connection in current streak
  longestUptimeMs: 0,           // longest continuous connected period
  currentStreakStart: null,     // start of current unbroken connection
  // no_error_week tracking
  weeklyErrors: 0,
  weekStart: null,              // ISO week string "2026-W11"
};

function isoWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultData };
    const data = JSON.parse(raw);

    // Reset today's counters on new day
    const today = new Date().toDateString();
    if (data.todayDate !== today) {
      data.todayTokensInput = 0;
      data.todayTokensOutput = 0;
      data.todayDate = today;
    }

    // Reset weekly error counter on new ISO week
    const thisWeek = isoWeek();
    if (data.weekStart !== thisWeek) {
      data.weeklyErrors = 0;
      data.weekStart = thisWeek;
    }

    return { ...defaultData, ...data };
  } catch {
    return { ...defaultData };
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* storage full */ }
}

/**
 * Call when gateway connects — tracks marathon streak start.
 */
export function onGatewayConnect(data) {
  const now = Date.now();
  return {
    ...data,
    currentStreakStart: now,
    firstConnectedAt: data.firstConnectedAt ?? now,
  };
}

/**
 * Call on each tick while connected (~every 60s).
 * Returns updated data + whether marathon was just unlocked.
 */
export function tickUptimeCheck(data) {
  if (!data.currentStreakStart) return { data, newAch: null };
  const uptimeMs = Date.now() - data.currentStreakStart;
  const MARATHON_MS = 24 * 60 * 60 * 1000;
  const updated = { ...data, longestUptimeMs: Math.max(data.longestUptimeMs || 0, uptimeMs) };
  if (!data.achievements.includes('marathon') && uptimeMs >= MARATHON_MS) {
    return {
      data: { ...updated, achievements: [...updated.achievements, 'marathon'] },
      newAch: 'marathon',
    };
  }
  return { data: updated, newAch: null };
}

/**
 * Call when an error occurs — tracks weekly errors for no_error_week.
 */
export function recordError(data) {
  const thisWeek = isoWeek();
  const updated = {
    ...data,
    weeklyErrors: (data.weekStart === thisWeek ? (data.weeklyErrors || 0) : 0) + 1,
    weekStart: thisWeek,
  };
  saveData(updated);
  return updated;
}

/**
 * Check no_error_week achievement on new week boundary.
 */
export function checkNoErrorWeek(data) {
  const thisWeek = isoWeek();
  if (data.weekStart && data.weekStart !== thisWeek && data.weeklyErrors === 0) {
    if (!data.achievements.includes('no_error_week')) {
      return { ...data, achievements: [...data.achievements, 'no_error_week'] };
    }
  }
  return data;
}

export const LEVELS = [
  { name: '虾苗',     min: 0,      max: 999    },
  { name: '小龙虾',   min: 1000,   max: 9999   },
  { name: '大龙虾',   min: 10000,  max: 49999  },
  { name: '霸王龙虾', min: 50000,  max: 199999 },
  { name: '龙虾神',   min: 200000, max: Infinity },
];

export function getLevel(totalTasks) {
  return LEVELS.findIndex(l => totalTasks <= l.max);
}

export const ACHIEVEMENTS = [
  { id: 'perfect_task',  emoji: '🎯', name: '一击必杀',    desc: 'Agent 0 错误完成复杂任务' },
  { id: 'lightning',     emoji: '⚡', name: '闪电侠',      desc: '平均响应 <2s' },
  { id: 'saver',         emoji: '🛡️', name: '省钱小能手',  desc: '极少 Token 完成高频工具调用' },
  { id: 'night_owl',     emoji: '🌙', name: '夜猫子',      desc: '凌晨 2-5 点还在工作' },
  { id: 'marathon',      emoji: '🔥', name: '连续作战',    desc: '连续 24 小时无中断运行' },
  { id: 'no_error_week', emoji: '💎', name: '零翻车周',    desc: '整周无 error' },
];
