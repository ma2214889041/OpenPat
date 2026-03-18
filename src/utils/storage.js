const STORAGE_KEY = 'openpat-data';

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
  firstConnectedAt: null,
  longestUptimeMs: 0,
  currentStreakStart: null,
  // no_error_week tracking
  weeklyErrors: 0,
  weekStart: null,
  // social tracking
  totalShares: 0,
  usedSkinIds: [],
  usedToolNames: [],
  // daily activity
  activeDays: [],
  // accessory
  selectedAccessory: 'none',
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

    const today = new Date().toDateString();
    if (data.todayDate !== today) {
      data.todayTokensInput = 0;
      data.todayTokensOutput = 0;
      data.todayDate = today;
    }

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

export function onGatewayConnect(data) {
  const now = Date.now();
  const today = new Date().toDateString();
  const activeDays = data.activeDays || [];
  const updatedDays = activeDays.includes(today) ? activeDays : [...activeDays, today];
  return {
    ...data,
    currentStreakStart: now,
    firstConnectedAt: data.firstConnectedAt ?? now,
    activeDays: updatedDays,
  };
}

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

export function checkNoErrorWeek(data) {
  const thisWeek = isoWeek();
  if (data.weekStart && data.weekStart !== thisWeek && data.weeklyErrors === 0) {
    if (!data.achievements.includes('no_error_week')) {
      return { ...data, achievements: [...data.achievements, 'no_error_week'] };
    }
  }
  return data;
}

/**
 * Check and unlock new achievements based on current data state.
 * Returns updated data.
 */
export function checkAchievements(data, { stats, usedToolName, didShare, activeSkinId } = {}) {
  let ach = [...(data.achievements || [])];
  const add = (id) => { if (!ach.includes(id)) ach.push(id); };

  // Track used skins
  let usedSkinIds = data.usedSkinIds || [];
  if (activeSkinId && !usedSkinIds.includes(activeSkinId)) {
    usedSkinIds = [...usedSkinIds, activeSkinId];
  }

  // Track used tools
  let usedToolNames = data.usedToolNames || [];
  if (usedToolName && !usedToolNames.includes(usedToolName)) {
    usedToolNames = [...usedToolNames, usedToolName];
  }

  // Track shares
  const totalShares = (data.totalShares || 0) + (didShare ? 1 : 0);

  const totalTasks = data.totalTasks;
  const totalTokens = data.totalTokensInput + data.totalTokensOutput;

  // 普通
  if (data.firstConnectedAt) add('first_connect');
  if ((data.totalToolCalls || 0) >= 1) add('first_tool');
  if (totalTasks >= 10) add('tasks_10');
  if (totalTokens >= 1000) add('tokens_1k');

  // 稀有
  if (totalTasks >= 100) add('tasks_100');
  if (usedSkinIds.length >= 3) add('skin_changer');
  if (totalShares >= 5) add('share_5');

  // 史诗
  if (totalTasks >= 1000) add('tasks_1000');
  if (usedToolNames.length >= 10) add('tool_variety');

  // Resident: 7 different active days
  if ((data.activeDays || []).length >= 7) add('resident');

  // 传说
  if (totalTasks >= 200000) add('lobster_god');
  if (usedSkinIds.length >= 6) add('skin_collector');

  // night_owl from existing logic (hour-based, called elsewhere)

  return { ...data, achievements: ach, usedSkinIds, usedToolNames, totalShares };
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
  // 普通
  { id: 'first_connect', emoji: '🐣', name: '破壳',        desc: '第一次连接 Agent',          rarity: 'common' },
  { id: 'first_tool',    emoji: '🔧', name: '第一次调用',   desc: '完成第一个工具调用',          rarity: 'common' },
  { id: 'tasks_10',      emoji: '✅', name: '初出茅庐',     desc: '完成 10 个任务',             rarity: 'common' },
  { id: 'tokens_1k',     emoji: '📊', name: '数据小白',     desc: '累计消耗 1000 tokens',       rarity: 'common' },
  // 稀有
  { id: 'perfect_task',  emoji: '🎯', name: '一击必杀',     desc: 'Agent 0 错误完成复杂任务',   rarity: 'rare' },
  { id: 'lightning',     emoji: '⚡', name: '闪电侠',       desc: '平均响应 <2s',               rarity: 'rare' },
  { id: 'saver',         emoji: '🛡️', name: '省钱小能手',   desc: '极少 Token 完成高频工具调用', rarity: 'rare' },
  { id: 'night_owl',     emoji: '🌙', name: '夜猫子',       desc: '凌晨 2-5 点还在工作',        rarity: 'rare' },
  { id: 'tasks_100',     emoji: '💪', name: '勤劳龙虾',     desc: '累计完成 100 个任务',         rarity: 'rare' },
  { id: 'marathon',      emoji: '🔥', name: '连续作战',     desc: '连续 24 小时无中断运行',      rarity: 'rare' },
  { id: 'skin_changer',  emoji: '🎨', name: '换装达人',     desc: '使用过 3 种不同皮肤',        rarity: 'rare' },
  { id: 'share_5',       emoji: '📸', name: '社交龙虾',     desc: '生成过 5 张分享卡片',        rarity: 'rare' },
  // 史诗
  { id: 'no_error_week', emoji: '💎', name: '零翻车周',     desc: '整周无 error',               rarity: 'epic' },
  { id: 'tasks_1000',    emoji: '🏆', name: '千里之行',     desc: '累计完成 1000 个任务',        rarity: 'epic' },
  { id: 'resident',      emoji: '🌍', name: '常驻居民',     desc: '连续 7 天每天都有活动',       rarity: 'epic' },
  { id: 'tool_variety',  emoji: '🔮', name: '全知全能',     desc: '调用过 10 种不同的工具',      rarity: 'epic' },
  // 传说
  { id: 'lobster_god',   emoji: '👑', name: '龙虾神',       desc: '达到最高等级（200K 任务）',   rarity: 'legendary' },
  { id: 'popular',       emoji: '🌟', name: '万人迷',       desc: '公开状态页被 100 人访问',     rarity: 'legendary' },
  { id: 'skin_collector',emoji: '🎭', name: '全皮肤收集者', desc: '拥有所有皮肤',               rarity: 'legendary' },
];

export const ACCESSORIES = [
  { id: 'none',        emoji: '🚫', name: '素颜',     desc: '不戴任何配饰',             unlock: null,            rarity: 'common'    },
  { id: 'party_hat',   emoji: '🎉', name: '派对帽',   desc: '第一次连接解锁',           unlock: 'first_connect', rarity: 'common'    },
  { id: 'sunglasses',  emoji: '😎', name: '墨镜',     desc: '完成第一次工具调用',        unlock: 'first_tool',    rarity: 'common'    },
  { id: 'graduation',  emoji: '🎓', name: '学士帽',   desc: '完成 10 个任务后解锁',      unlock: 'tasks_10',      rarity: 'rare'      },
  { id: 'top_hat',     emoji: '🎩', name: '礼帽',     desc: '深夜奋战的荣耀',           unlock: 'night_owl',     rarity: 'rare'      },
  { id: 'chef_hat',    emoji: '👨‍🍳', name: '厨师帽',  desc: '连续 24 小时不间断',       unlock: 'marathon',      rarity: 'epic'      },
  { id: 'halo',        emoji: '✨', name: '光环',     desc: '整周零错误的神迹',          unlock: 'no_error_week', rarity: 'epic'      },
  { id: 'crown',       emoji: '👑', name: '王冠',     desc: '完成 100 个任务的象征',     unlock: 'tasks_100',     rarity: 'legendary' },
  { id: 'cyber_visor', emoji: '🥽', name: '赛博目镜', desc: '千任务精英专属',            unlock: 'tasks_1000',    rarity: 'legendary' },
];

export function getUnlockedAccessories(achievements = []) {
  return ACCESSORIES.filter(a => a.unlock === null || achievements.includes(a.unlock)).map(a => a.id);
}

export const RARITY_COLORS = {
  common:    { bg: 'rgba(100,116,139,0.15)',  border: 'rgba(100,116,139,0.3)',  text: '#94a3b8' },
  rare:      { bg: 'rgba(59,130,246,0.12)',   border: 'rgba(59,130,246,0.3)',   text: '#60a5fa' },
  epic:      { bg: 'rgba(139,92,246,0.15)',   border: 'rgba(139,92,246,0.35)',  text: '#a78bfa' },
  legendary: { bg: 'rgba(245,158,11,0.15)',   border: 'rgba(245,158,11,0.4)',   text: '#fbbf24' },
};
