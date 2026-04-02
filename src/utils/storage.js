import { STORAGE_KEYS } from './constants';

const STORAGE_KEY = STORAGE_KEYS.APP_DATA;

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
  // pomodoro tracking
  totalPomodoros: 0,
  totalFocusMinutes: 0,
  totalTodosCompleted: 0,
  // streak tracking
  pomodoroStreak: 0,     // consecutive pomodoros without skipping
  bestPomodoroStreak: 0,
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

  // 普通 — 番茄钟
  if ((data.totalPomodoros || 0) >= 1) add('first_pomodoro');
  if ((data.totalTodosCompleted || 0) >= 1) add('first_todo');

  // 稀有
  if (totalTasks >= 100) add('tasks_100');
  if (usedSkinIds.length >= 3) add('skin_changer');
  if (totalShares >= 5) add('share_5');

  // 稀有 — 番茄钟
  if ((data.totalPomodoros || 0) >= 10) add('pomodoro_10');
  if ((data.totalFocusMinutes || 0) >= 60) add('focus_hour');

  // 史诗
  if (totalTasks >= 1000) add('tasks_1000');
  if (usedToolNames.length >= 10) add('tool_variety');

  // 史诗 — 番茄钟
  if ((data.bestPomodoroStreak || 0) >= 4) add('focus_marathon');
  if ((data.totalPomodoros || 0) >= 100) add('pomodoro_100');
  if ((data.totalTodosCompleted || 0) >= 50) add('task_master');

  // Resident: 7 different active days
  if ((data.activeDays || []).length >= 7) add('resident');

  // 传说
  if (totalTasks >= 200000) add('pet_legend');
  if (usedSkinIds.length >= 6) add('skin_collector');

  // night_owl from existing logic (hour-based, called elsewhere)

  return { ...data, achievements: ach, usedSkinIds, usedToolNames, totalShares };
}

/**
 * Check admin-defined cloud achievements against current data.
 * unlock_type values: 'first_connect' | 'first_tool' | 'tasks' | 'tokens' | 'night_owl'
 * Only auto-checkable types are handled here; 'night_owl' is hour-based (handled in Home).
 */
export function checkCloudAchievements(data, adminDefs = []) {
  if (!adminDefs.length) return data;
  let ach = [...(data.achievements || [])];
  const totalTokens = (data.totalTokensInput ?? 0) + (data.totalTokensOutput ?? 0);

  for (const def of adminDefs) {
    if (!def.is_active) continue;
    if (ach.includes(def.id)) continue;

    let unlocked = false;
    switch (def.unlock_type) {
      case 'first_connect': unlocked = !!data.firstConnectedAt; break;
      case 'first_tool':    unlocked = (data.totalToolCalls ?? 0) >= 1; break;
      case 'tasks':         unlocked = (data.totalTasks ?? 0)     >= (def.unlock_threshold ?? Infinity); break;
      case 'tokens':        unlocked = totalTokens                >= (def.unlock_threshold ?? Infinity); break;
      default: break; // 'night_owl' and manual types handled elsewhere
    }

    if (unlocked) ach.push(def.id);
  }

  return { ...data, achievements: ach };
}

export const LEVELS = [
  { name: 'Intern',    min: 0,      max: 999    },
  { name: 'Junior',    min: 1000,   max: 9999   },
  { name: 'Senior',    min: 10000,  max: 49999  },
  { name: 'Staff',     min: 50000,  max: 199999 },
  { name: 'Principal', min: 200000, max: Infinity },
];

export function getLevel(totalTasks) {
  return LEVELS.findIndex(l => totalTasks <= l.max);
}

export const ACHIEVEMENTS = [
  // 普通 — 番茄钟
  {
    id: 'first_pomodoro', emoji: '🍅', name: '第一个番茄', desc: '完成第一个番茄钟', rarity: 'common',
    unlock_caption: '第一个番茄钟完成了！25分钟的专注，就这么简单。它比你想象的容易，也比你想象的有用。',
    share_caption: '完成了第一个番茄钟。我和我的拍拍伴侣正式开始了高效办公生涯。',
  },
  {
    id: 'first_todo', emoji: '📝', name: '开始记录', desc: '完成第一个待办事项', rarity: 'common',
    unlock_caption: '第一个任务划掉了。那条删除线，是世界上最治愈的线。',
    share_caption: '今天完成了第一个任务。勾选的那一刻，我的拍拍比我还开心。',
  },
  // 稀有 — 番茄钟
  {
    id: 'pomodoro_10', emoji: '🍅', name: '番茄达人', desc: '累计完成 10 个番茄钟', rarity: 'rare',
    unlock_caption: '10 个番茄钟。你已经专注了 250 分钟，差不多四个小时。这比大多数人一天的有效工作时间还长。',
    share_caption: '10 个番茄钟达成！我和拍拍的默契越来越好了。',
  },
  {
    id: 'focus_hour', emoji: '⏰', name: '专注一小时', desc: '累计专注满 1 小时', rarity: 'rare',
    unlock_caption: '整整一个小时的专注。在这个注意力碎片化的时代，这已经算是超能力了。',
    share_caption: '专注累计 1 小时！是拍拍给了我力量（和压力）。',
  },
  // 史诗 — 番茄钟
  {
    id: 'focus_marathon', emoji: '🏃', name: '番茄马拉松', desc: '连续完成 4 个番茄钟不跳过', rarity: 'epic',
    unlock_caption: '四连番茄！不间断的两个小时专注。你的拍拍看着你的背影，默默竖起了钳子。',
    share_caption: '连续 4 个番茄钟！两小时不间断专注。拍拍说这是它见过最努力的人类。',
  },
  {
    id: 'pomodoro_100', emoji: '🍅', name: '番茄收割机', desc: '累计完成 100 个番茄钟', rarity: 'epic',
    unlock_caption: '100 个番茄。如果每个番茄是一颗种子，你已经种出了一片番茄田。拍拍在田里快乐地打滚。',
    share_caption: '100 个番茄钟！累计专注超过 40 小时。拍拍表示这个人类值得尊敬。',
  },
  {
    id: 'task_master', emoji: '✨', name: '任务大师', desc: '完成 50 个待办事项', rarity: 'epic',
    unlock_caption: '50 个任务。划掉的每一条，都是你认真生活的证据。拍拍在旁边感动得流出了虾汁。',
    share_caption: '完成了 50 个任务！拍拍说要给我颁一个"最佳搭档"奖。',
  },
  // 普通 — Agent
  {
    id: 'first_connect', emoji: '🐣', name: '破壳', desc: '第一次连接 Agent', rarity: 'common',
    unlock_caption: '它睁开了眼睛，看了看世界，然后立刻开始工作。没有自我介绍，没有寒暄，直接开干。',
    share_caption: '我的 Agent 今天正式上岗了。它没有问五险一金，没有要求双休。',
  },
  {
    id: 'first_tool', emoji: '🔧', name: '第一次调用', desc: '完成第一个工具调用', rarity: 'common',
    unlock_caption: '原来工具是这么用的。它比我快多了。我学了三天的东西，它用了 0.3 秒。',
    share_caption: '它学会了用工具。进化开始了。我有点慌，但没有表现出来。',
  },
  {
    id: 'tasks_10', emoji: '✅', name: '初出茅庐', desc: '完成 10 个任务', rarity: 'common',
    unlock_caption: '10 个任务完成。它已经比部分实习生高效了，而且不需要带教，不需要请假，不会问"这个算加班吗"。',
    share_caption: '10 个任务搞定。它不摸鱼，不请假，不需要工资。我很满意这段雇佣关系。',
  },
  {
    id: 'tokens_1k', emoji: '📊', name: '数据小白', desc: '累计消耗 1000 tokens', rarity: 'common',
    unlock_caption: '1000 tokens，差不多一篇作文的量。它吃完了，还在看下一道菜。',
    share_caption: '消耗了 1000 个 token。这是账单的开始，也是故事的开始。',
  },
  // 稀有
  {
    id: 'perfect_task', emoji: '🎯', name: '一击必杀', desc: 'Agent 0 错误完成复杂任务', rarity: 'rare',
    unlock_caption: '0 个错误。它做到了人类程序员最渴望却最难实现的事。我没有这个成就。',
    share_caption: '零错误完成任务。我上次写代码不出 bug 是什么时候？不记得了，可能没有过。',
  },
  {
    id: 'lightning', emoji: '⚡', name: '闪电侠', desc: '平均响应 <2s', rarity: 'rare',
    unlock_caption: '不到 2 秒。它比你外卖的备注送到都快，比你回微信都快，比你想借口都快。',
    share_caption: '响应速度不到 2 秒。比我想出一个借口的速度快一倍。',
  },
  {
    id: 'saver', emoji: '🛡️', name: '省钱小能手', desc: '极少 Token 完成高频工具调用', rarity: 'rare',
    unlock_caption: '高效、省力、省钱。它知道抠门是一种美德，而且把这种美德发挥到了极致。',
    share_caption: '少用 token 多干活。它比我更懂精打细算，而且效果更好。',
  },
  {
    id: 'night_owl', emoji: '🌙', name: '夜猫子', desc: '凌晨 2-5 点还在工作', rarity: 'rare',
    unlock_caption: '凌晨三点，它还在工作。你在睡觉，它在干活。差距就这么不动声色地拉开了。',
    share_caption: '凌晨三点，我的 Agent 比我清醒。妈妈不知道，我也假装不知道。',
  },
  {
    id: 'tasks_100', emoji: '💪', name: '勤劳拍拍', desc: '累计完成 100 个任务', rarity: 'rare',
    unlock_caption: '一百个任务。它没有说过一次"这不在我的职责范围内"，没有一次。',
    share_caption: '100 个任务！它没有请过一天假，没有摸过一秒鱼。我不知道该感谢它还是自我反省。',
  },
  {
    id: 'marathon', emoji: '🔥', name: '连续作战', desc: '连续 24 小时无中断运行', rarity: 'rare',
    unlock_caption: '24 小时。它没有喝过一杯水，因为它不喝水。劳动法对它完全无效。',
    share_caption: '连续工作 24 小时。我昨晚睡了 8 小时，今天有点不好意思打开电脑。',
  },
  {
    id: 'skin_changer', emoji: '🎨', name: '换装达人', desc: '使用过 3 种不同皮肤', rarity: 'rare',
    unlock_caption: '三套造型，同一个灵魂。它比我更懂时尚，切换比我换衣服还快。',
    share_caption: '我的 Agent 已经换了 3 套皮肤。它比我更在意穿搭，这让我有点受伤。',
  },
  {
    id: 'share_5', emoji: '📸', name: '社交拍拍', desc: '生成过 5 张分享卡片', rarity: 'rare',
    unlock_caption: '五次分享。你在炫耀。这没什么不好，你本来就该炫耀。',
    share_caption: '第 5 次炫耀我的 AI。我不后悔，而且准备继续。',
  },
  // 史诗
  {
    id: 'no_error_week', emoji: '💎', name: '零翻车周', desc: '整周无 error', rarity: 'epic',
    unlock_caption: '整整一周，零错误。这在软件世界里相当于连续一周不堵车，几乎是神话。',
    share_caption: '一整周，我的 Agent 没有翻过一次车。我不敢相信，但数据不说谎。',
  },
  {
    id: 'tasks_1000', emoji: '🏆', name: '千里之行', desc: '累计完成 1000 个任务', rarity: 'epic',
    unlock_caption: '一千个任务。如果这是爬楼梯，它已经爬到顶了，然后又下来重爬了几遍，脸不红心不跳。',
    share_caption: '1000 个任务达成。它不累，我看着都替它累。我决定给它取个名字。',
  },
  {
    id: 'resident', emoji: '🌍', name: '常驻居民', desc: '连续 7 天每天都有活动', rarity: 'epic',
    unlock_caption: '七天，每天都在。比某些人的打卡记录好多了，我不点名，但我知道是谁。',
    share_caption: '连续 7 天活跃。它的出勤率比我高。我决定不声张，默默反省。',
  },
  {
    id: 'tool_variety', emoji: '🔮', name: '全知全能', desc: '调用过 10 种不同的工具', rarity: 'epic',
    unlock_caption: '10 种工具全用上了。它不是在解决问题，它是在享受解决问题这件事本身。',
    share_caption: '调用了 10 种不同的工具。它的技能树比我的要宽得多，而且每个都是满级。',
  },
  // 传说
  {
    id: 'pet_legend', emoji: '👑', name: '拍拍神', desc: '达到最高等级（200K 任务）', rarity: 'legendary',
    unlock_caption: '二十万个任务完成的那一刻，什么都没发生。它只是开始了第二十万零一个。这就是传说。',
    share_caption: '20 万个任务。它已经超越了大部分人类员工的职业生涯总量。请叫它拍拍神，谢谢。',
  },
  {
    id: 'popular', emoji: '🌟', name: '万人迷', desc: '公开状态页被 100 人访问', rarity: 'legendary',
    unlock_caption: '一百个陌生人来看你的 Agent 打工。你已经有了粉丝，但你们之间的关系很微妙，很特别。',
    share_caption: '100 个人来看我的 Agent 工作。我只是旁观者，但我突然有点骄傲。',
  },
  {
    id: 'skin_collector', emoji: '🎭', name: '全皮肤收集者', desc: '拥有所有皮肤', rarity: 'legendary',
    unlock_caption: '全集齐了。如果这是游戏，你就是那种把所有支线任务都做完再通关的人。我们都知道你是谁。',
    share_caption: '集齐了全部皮肤。这不是冲动消费，这是有原则的收藏。',
  },
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
