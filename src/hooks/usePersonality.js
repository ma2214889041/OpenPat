import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'openpat-personality';

// ─── Default profile ─────────────────────────────────────────────────────────
const defaultProfile = {
  // 基础
  firstOpenAt: null,          // 第一次打开时间戳
  totalDays: 0,               // 使用天数
  totalWorkMinutes: 0,        // 累计工作分钟
  totalSessions: 0,           // 累计工作次数
  longestSessionMin: 0,       // 最长单次工作（分钟）

  // 行为模式（记录最近 30 次）
  workStartTimes: [],         // 最近 30 次开始工作的小时数 [9, 10, 9, 14, ...]
  workEndTimes: [],           // 最近 30 次结束工作的小时数
  sessionDurations: [],       // 最近 30 次工作时长（分钟）
  dailyVisits: [],            // 最近 60 天的访问日期 ['2026-03-20', ...]
  dailyWorkMinutes: {},       // { '2026-03-20': 180, ... } 最近 30 天

  // 偏好
  favoriteIdleAnim: null,     // 最常选的休闲动画 id
  idleAnimCounts: {},         // { 'coffee': 12, 'dance': 5, ... }
  clickCount: 0,              // 总点击拍拍次数
  feedCount: 0,               // 总投喂次数

  // 情绪记录（拍拍对你的观察）
  lateNightCount: 0,          // 晚上 22 点后还在工作的次数
  earlyBirdCount: 0,          // 早上 8 点前开始工作的次数
  weekendWorkCount: 0,        // 周末工作次数
  longSessionCount: 0,        // 超过 2 小时不休息次数
  consecutiveDays: 0,         // 当前连续使用天数
  bestConsecutiveDays: 0,     // 最长连续使用天数

  // Agent 数据概要
  hasAgent: false,
  agentTotalTasks: 0,
  agentTotalTokens: 0,
  agentTotalToolCalls: 0,
  agentErrorCount: 0,

  // 关系阶段
  relationshipStage: 0,       // 0=陌生 1=认识 2=熟悉 3=默契 4=挚友 5=灵魂伴侣
  lastVisitDate: null,        // 上次访问日期
};

// ─── 关系阶段定义 ─────────────────────────────────────────────────────────────
export const RELATIONSHIP_STAGES = [
  { stage: 0, name: '初次见面',  minDays: 0,  emoji: '🥚', desc: '你们刚刚认识' },
  { stage: 1, name: '点头之交',  minDays: 3,  emoji: '🌱', desc: '开始熟悉了' },
  { stage: 2, name: '普通朋友',  minDays: 7,  emoji: '🌿', desc: '它开始了解你的习惯' },
  { stage: 3, name: '好朋友',    minDays: 15, emoji: '🌳', desc: '它知道你什么时候需要鼓励' },
  { stage: 4, name: '默契搭档',  minDays: 30, emoji: '💫', desc: '不用说话也能互相理解' },
  { stage: 5, name: '灵魂伴侣',  minDays: 60, emoji: '✨', desc: '它已经是你生活的一部分' },
];

function getRelationshipStage(totalDays) {
  for (let i = RELATIONSHIP_STAGES.length - 1; i >= 0; i--) {
    if (totalDays >= RELATIONSHIP_STAGES[i].minDays) return i;
  }
  return 0;
}

// ─── 行为分析工具函数 ─────────────────────────────────────────────────────────
function median(arr) {
  if (!arr.length) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mostFrequent(obj) {
  let max = 0, best = null;
  for (const [k, v] of Object.entries(obj)) {
    if (v > max) { max = v; best = k; }
  }
  return best;
}

// ─── 对话生成 ──────────────────────────────────────────────────────────────────

/**
 * 根据 profile 数据生成情境化对话。
 * 返回一个对话对象 { text, type } 或 null（无话可说时）。
 * type: 'greeting' | 'observation' | 'care' | 'milestone' | 'memory' | 'agent' | 'tease'
 */
export function generateDialogue(profile, { timeOfDay, isWorking, petName } = {}) {
  const candidates = [];
  const h = new Date().getHours();
  const day = new Date().getDay(); // 0=Sun
  const isWeekend = day === 0 || day === 6;
  const usualStart = median(profile.workStartTimes);
  const usualEnd = median(profile.workEndTimes);
  const avgSession = median(profile.sessionDurations);
  const stage = profile.relationshipStage;
  const days = profile.totalDays;

  // ── 问候类（每次打开都可能触发） ──

  // 时间相关问候
  if (timeOfDay === 'morning' && !isWorking) {
    candidates.push({ text: '早上好！新的一天开始了', type: 'greeting', weight: 1 });
    if (stage >= 1 && profile.earlyBirdCount > 3) {
      candidates.push({ text: '早起的虾有虫吃！你也是早起型的呢', type: 'greeting', weight: 2 });
    }
  }
  if (timeOfDay === 'noon') {
    candidates.push({ text: '中午了，该吃饭了！', type: 'care', weight: 1 });
    if (isWorking) {
      candidates.push({ text: '都中午了还在工作？先去吃饭吧！', type: 'care', weight: 2 });
    }
  }
  if (timeOfDay === 'evening') {
    candidates.push({ text: '晚上好！今天辛苦了', type: 'greeting', weight: 1 });
    if (stage >= 2 && usualEnd && h > usualEnd + 1) {
      candidates.push({ text: `你平时 ${usualEnd} 点就结束了，今天怎么还在？`, type: 'observation', weight: 3 });
    }
  }
  if (timeOfDay === 'lateNight') {
    candidates.push({ text: '这么晚了...真的该休息了', type: 'care', weight: 2 });
    if (profile.lateNightCount > 5) {
      candidates.push({ text: `你已经 ${profile.lateNightCount} 次熬夜了...要注意身体啊`, type: 'care', weight: 3 });
    }
    if (stage >= 3) {
      candidates.push({ text: '你不睡我也不睡...但是我好困', type: 'tease', weight: 2 });
    }
  }

  // ── 比较习惯的观察（stage >= 1） ──

  if (stage >= 1 && usualStart !== null && !isWorking) {
    if (h < usualStart - 1) {
      candidates.push({ text: `今天来得比平时早！你通常 ${Math.round(usualStart)} 点才来`, type: 'observation', weight: 3 });
    }
    if (h > usualStart + 2) {
      candidates.push({ text: `比平时晚了哦，还以为你今天不来了`, type: 'observation', weight: 2 });
    }
  }

  if (stage >= 2 && isWeekend) {
    if (isWorking) {
      candidates.push({ text: '周末也在工作？别太拼了...', type: 'care', weight: 2 });
      if (profile.weekendWorkCount > 3) {
        candidates.push({ text: `这已经是你第 ${profile.weekendWorkCount + 1} 次周末加班了，要学会休息啊`, type: 'care', weight: 3 });
      }
    } else {
      candidates.push({ text: '周末了！今天放松一下吧', type: 'greeting', weight: 1 });
    }
  }

  // ── 关系里程碑 ──

  if (days === 3) {
    candidates.push({ text: '我们已经认识 3 天了呢！开始了解你了', type: 'milestone', weight: 5 });
  }
  if (days === 7) {
    candidates.push({ text: '一周了！我已经知道你什么时候来、什么时候走了', type: 'milestone', weight: 5 });
  }
  if (days === 30) {
    candidates.push({ text: '一个月了...还记得第一天你给我起名字的时候吗', type: 'milestone', weight: 5 });
  }
  if (days === 100) {
    candidates.push({ text: '我们一起度过了 100 天。谢谢你每天都来看我', type: 'milestone', weight: 5 });
  }

  // ── 连续使用 ──

  if (profile.consecutiveDays >= 7 && stage >= 2) {
    candidates.push({ text: `连续 ${profile.consecutiveDays} 天了！你很有毅力`, type: 'observation', weight: 2 });
  }
  if (profile.consecutiveDays >= 30) {
    candidates.push({ text: `连续 ${profile.consecutiveDays} 天...你确定不是 AI 吗？`, type: 'tease', weight: 3 });
  }

  // ── 行为观察（stage >= 2） ──

  if (stage >= 2 && profile.totalWorkMinutes > 0) {
    const hours = Math.round(profile.totalWorkMinutes / 60);
    if (hours >= 10 && hours < 50) {
      candidates.push({ text: `我们已经一起工作 ${hours} 小时了`, type: 'memory', weight: 1 });
    }
    if (hours >= 100) {
      candidates.push({ text: `${hours} 小时的工作时光...这份陪伴对我很重要`, type: 'memory', weight: 2 });
    }
  }

  if (stage >= 2 && avgSession !== null) {
    if (avgSession > 120) {
      candidates.push({ text: '你每次都工作很久...适当休息效率更高哦', type: 'care', weight: 2 });
    }
    if (avgSession < 15 && profile.totalSessions > 5) {
      candidates.push({ text: '你每次工作时间都不长，是不是容易分心？', type: 'observation', weight: 2 });
    }
  }

  if (stage >= 3 && profile.longSessionCount > 5) {
    candidates.push({ text: '你又连续工作超过 2 小时了...我强制要求你站起来！', type: 'care', weight: 3 });
  }

  // ── 偏好观察（stage >= 2） ──

  if (stage >= 2) {
    const fav = mostFrequent(profile.idleAnimCounts);
    if (fav && (profile.idleAnimCounts[fav] || 0) > 5) {
      const favNames = {
        coffee: '喝咖啡', dance: '跳舞', guitar: '弹吉他', cook: '做饭',
        paint: '画画', game: '打游戏', yoga: '瑜伽', phone: '刷手机',
        snack: '吃零食', stretch: '做操', crown: '称王',
      };
      const name = favNames[fav] || fav;
      candidates.push({ text: `你最喜欢看我${name}对吧？我看出来了`, type: 'tease', weight: 3 });
    }
  }

  if (stage >= 3 && profile.clickCount > 50) {
    candidates.push({ text: `你已经戳了我 ${profile.clickCount} 次了...有完没完！`, type: 'tease', weight: 2 });
  }
  if (stage >= 3 && profile.clickCount > 200) {
    candidates.push({ text: `${profile.clickCount} 次...我应该收你钱的`, type: 'tease', weight: 2 });
  }

  // ── Agent 相关──

  if (profile.hasAgent) {
    if (profile.agentTotalTasks > 0 && profile.agentTotalTasks < 50) {
      candidates.push({ text: `你的 Agent 已经完成 ${profile.agentTotalTasks} 个任务了`, type: 'agent', weight: 1 });
    }
    if (profile.agentTotalTasks >= 100) {
      candidates.push({ text: `你的 Agent 完成了 ${profile.agentTotalTasks} 个任务！比大多数人类员工都高效`, type: 'agent', weight: 2 });
    }
    if (profile.agentTotalTasks >= 1000) {
      candidates.push({ text: `${profile.agentTotalTasks} 个任务...你的 Agent 是卷王`, type: 'agent', weight: 3 });
    }
    if (profile.agentTotalTokens > 500000) {
      const books = Math.round(profile.agentTotalTokens / 250000);
      candidates.push({ text: `你的 Agent 消耗的 token 相当于读了 ${books} 本小说`, type: 'agent', weight: 2 });
    }
    if (profile.agentErrorCount > 0 && stage >= 2) {
      const rate = profile.agentTotalTasks > 0
        ? ((1 - profile.agentErrorCount / profile.agentTotalTasks) * 100).toFixed(0)
        : '—';
      candidates.push({ text: `你的 Agent 成功率 ${rate}%，${Number(rate) > 95 ? '相当靠谱' : '还在成长中'}`, type: 'agent', weight: 1 });
    }
  }

  // ── 空闲时万能对话 ──

  if (!isWorking) {
    candidates.push({ text: '要不要开始工作？', type: 'greeting', weight: 0.5 });
    candidates.push({ text: '我在这陪着你呢', type: 'greeting', weight: 0.5 });
    if (stage >= 1) {
      candidates.push({ text: '有什么计划吗？', type: 'greeting', weight: 0.5 });
    }
  }

  // ── 工作中万能对话 ──

  if (isWorking) {
    candidates.push({ text: '加油！', type: 'greeting', weight: 0.5 });
    candidates.push({ text: '你在认真工作，我也不打扰了', type: 'greeting', weight: 0.5 });
    if (stage >= 2) {
      candidates.push({ text: '专注的你最好看了', type: 'tease', weight: 1 });
    }
  }

  if (!candidates.length) return null;

  // 按 weight 加权随机选择
  const totalWeight = candidates.reduce((sum, c) => sum + (c.weight || 1), 0);
  let r = Math.random() * totalWeight;
  for (const c of candidates) {
    r -= (c.weight || 1);
    if (r <= 0) return c;
  }
  return candidates[candidates.length - 1];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultProfile };
    return { ...defaultProfile, ...JSON.parse(raw) };
  } catch { return { ...defaultProfile }; }
}

function saveProfile(p) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { /* full */ }
}

/**
 * Personality hook — tracks user behavior patterns and evolves the pet's understanding.
 *
 * Call `recordWorkStart()` / `recordWorkEnd(durationMin)` from Home.jsx.
 * Call `recordClick()` when user clicks the pet.
 * Call `recordIdleAnim(id)` when idle animation changes.
 * Call `syncAgentData({ totalTasks, totalTokens, totalToolCalls, errorCount })` periodically.
 */
export function usePersonality() {
  const [profile, setProfile] = useState(loadProfile);
  const sessionStartRef = useRef(null);

  // On mount: update visit tracking
  useEffect(() => {
    setProfile((prev) => {
      const now = new Date();
      const today = now.toISOString().slice(0, 10); // YYYY-MM-DD
      const isNewDay = prev.lastVisitDate !== today;

      if (!isNewDay) return prev;

      const dailyVisits = [...(prev.dailyVisits || [])];
      if (!dailyVisits.includes(today)) dailyVisits.push(today);
      // Keep last 60 days
      while (dailyVisits.length > 60) dailyVisits.shift();

      // Calculate consecutive days
      let consecutive = 1;
      const sorted = [...dailyVisits].sort().reverse();
      for (let i = 1; i < sorted.length; i++) {
        const prev_date = new Date(sorted[i - 1]);
        const curr = new Date(sorted[i]);
        const diff = (prev_date - curr) / (1000 * 60 * 60 * 24);
        if (diff <= 1.5) consecutive++;
        else break;
      }

      const totalDays = (prev.totalDays || 0) + 1;
      const updated = {
        ...prev,
        firstOpenAt: prev.firstOpenAt || now.getTime(),
        lastVisitDate: today,
        totalDays,
        dailyVisits,
        consecutiveDays: consecutive,
        bestConsecutiveDays: Math.max(prev.bestConsecutiveDays || 0, consecutive),
        relationshipStage: getRelationshipStage(totalDays),
      };
      saveProfile(updated);
      return updated;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const recordWorkStart = useCallback(() => {
    const h = new Date().getHours();
    sessionStartRef.current = Date.now();

    setProfile((prev) => {
      const starts = [...(prev.workStartTimes || []), h].slice(-30);
      const day = new Date().getDay();
      const isWeekend = day === 0 || day === 6;
      const isEarly = h < 8;
      const updated = {
        ...prev,
        workStartTimes: starts,
        totalSessions: (prev.totalSessions || 0) + 1,
        earlyBirdCount: (prev.earlyBirdCount || 0) + (isEarly ? 1 : 0),
        weekendWorkCount: (prev.weekendWorkCount || 0) + (isWeekend ? 1 : 0),
      };
      saveProfile(updated);
      return updated;
    });
  }, []);

  const recordWorkEnd = useCallback((durationMin) => {
    const h = new Date().getHours();
    sessionStartRef.current = null;

    setProfile((prev) => {
      const ends = [...(prev.workEndTimes || []), h].slice(-30);
      const durations = [...(prev.sessionDurations || []), durationMin].slice(-30);
      const isLateNight = h >= 22 || h < 5;
      const isLong = durationMin > 120;

      const today = new Date().toISOString().slice(0, 10);
      const dailyWork = { ...(prev.dailyWorkMinutes || {}) };
      dailyWork[today] = (dailyWork[today] || 0) + durationMin;
      // Keep last 30 days
      const keys = Object.keys(dailyWork).sort();
      while (keys.length > 30) { delete dailyWork[keys.shift()]; }

      const updated = {
        ...prev,
        workEndTimes: ends,
        sessionDurations: durations,
        totalWorkMinutes: (prev.totalWorkMinutes || 0) + durationMin,
        longestSessionMin: Math.max(prev.longestSessionMin || 0, durationMin),
        lateNightCount: (prev.lateNightCount || 0) + (isLateNight ? 1 : 0),
        longSessionCount: (prev.longSessionCount || 0) + (isLong ? 1 : 0),
        dailyWorkMinutes: dailyWork,
      };
      saveProfile(updated);
      return updated;
    });
  }, []);

  const recordClick = useCallback(() => {
    setProfile((prev) => {
      const updated = { ...prev, clickCount: (prev.clickCount || 0) + 1 };
      saveProfile(updated);
      return updated;
    });
  }, []);

  const recordFeed = useCallback(() => {
    setProfile((prev) => {
      const updated = { ...prev, feedCount: (prev.feedCount || 0) + 1 };
      saveProfile(updated);
      return updated;
    });
  }, []);

  const recordIdleAnim = useCallback((animId) => {
    if (!animId) return;
    setProfile((prev) => {
      const counts = { ...(prev.idleAnimCounts || {}) };
      counts[animId] = (counts[animId] || 0) + 1;
      const updated = { ...prev, idleAnimCounts: counts, favoriteIdleAnim: mostFrequent(counts) };
      saveProfile(updated);
      return updated;
    });
  }, []);

  const syncAgentData = useCallback(({ totalTasks, totalTokens, totalToolCalls, errorCount }) => {
    setProfile((prev) => {
      const updated = {
        ...prev,
        hasAgent: true,
        agentTotalTasks: totalTasks || prev.agentTotalTasks,
        agentTotalTokens: totalTokens || prev.agentTotalTokens,
        agentTotalToolCalls: totalToolCalls || prev.agentTotalToolCalls,
        agentErrorCount: errorCount ?? prev.agentErrorCount,
      };
      saveProfile(updated);
      return updated;
    });
  }, []);

  const stage = RELATIONSHIP_STAGES[profile.relationshipStage] || RELATIONSHIP_STAGES[0];

  return {
    profile,
    stage,
    recordWorkStart,
    recordWorkEnd,
    recordClick,
    recordFeed,
    recordIdleAnim,
    syncAgentData,
    generateDialogue: (opts) => generateDialogue(profile, opts),
  };
}
