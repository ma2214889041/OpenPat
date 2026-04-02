import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'openpat-activity';

/**
 * Idle/break animations that the pet performs when not working.
 * Each has unique CSS animations applied to the SVG.
 * They unlock progressively as the user completes pomodoros.
 */
export const IDLE_ANIMATIONS = [
  {
    id: 'chill',
    emoji: '😌',
    name: '发呆',
    desc: '安静地发呆',
    svgClass: 'idle-chill',
    unlock: 0, // always available
  },
  {
    id: 'coffee',
    emoji: '☕',
    name: '喝咖啡',
    desc: '悠闲地品一杯咖啡',
    svgClass: 'idle-coffee',
    unlock: 0, // always available
  },
  {
    id: 'phone',
    emoji: '📱',
    name: '刷手机',
    desc: '偷偷刷一下手机',
    svgClass: 'idle-phone',
    unlock: 3,
  },
  {
    id: 'stretch',
    emoji: '🙆',
    name: '做操',
    desc: '站起来伸展一下',
    svgClass: 'idle-stretch',
    unlock: 5,
  },
  {
    id: 'snack',
    emoji: '🍿',
    name: '吃零食',
    desc: '偷偷吃点小零食',
    svgClass: 'idle-snack',
    unlock: 8,
  },
  {
    id: 'dance',
    emoji: '💃',
    name: '跳舞',
    desc: '开心地扭一扭',
    svgClass: 'idle-dance',
    unlock: 12,
  },
  {
    id: 'guitar',
    emoji: '🎸',
    name: '弹吉他',
    desc: '弹一首小曲儿',
    svgClass: 'idle-guitar',
    unlock: 18,
  },
  {
    id: 'cook',
    emoji: '🍳',
    name: '做饭',
    desc: '给自己做顿好吃的',
    svgClass: 'idle-cook',
    unlock: 25,
  },
  {
    id: 'paint',
    emoji: '🎨',
    name: '画画',
    desc: '画一幅小画',
    svgClass: 'idle-paint',
    unlock: 35,
  },
  {
    id: 'yoga',
    emoji: '🧘',
    name: '瑜伽',
    desc: '做一组瑜伽放松身心',
    svgClass: 'idle-yoga',
    unlock: 50,
  },
  {
    id: 'game',
    emoji: '🎮',
    name: '打游戏',
    desc: '偷偷打一把游戏',
    svgClass: 'idle-game',
    unlock: 75,
  },
  {
    id: 'crown',
    emoji: '👑',
    name: '称王',
    desc: '已经是这片海域的王了',
    svgClass: 'idle-crown',
    unlock: 100,
  },
];

/**
 * Returns unlocked idle animations based on total pomodoros completed.
 */
export function getUnlockedAnimations(totalPomodoros = 0) {
  return IDLE_ANIMATIONS.filter((a) => totalPomodoros >= a.unlock);
}

function loadSavedActivity() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'auto';
  } catch { return 'auto'; }
}

/**
 * Activity / idle-animation hook.
 *
 * In 'auto' mode, randomly rotates through unlocked animations.
 * User can also pin a specific animation.
 */
export function useActivity(totalPomodoros = 0) {
  const [selected, setSelected] = useState(loadSavedActivity);
  const [currentAnim, setCurrentAnim] = useState('chill');
  const rotateRef = useRef(null);

  const unlocked = getUnlockedAnimations(totalPomodoros);
  const unlockedIds = unlocked.map((a) => a.id);

  // Auto-rotate: pick a random unlocked animation every 45s
  useEffect(() => {
    if (selected !== 'auto') {
      setCurrentAnim(unlockedIds.includes(selected) ? selected : 'chill');
      return;
    }

    const pick = () => {
      if (unlockedIds.length <= 1) { setCurrentAnim('chill'); return; }
      const next = unlockedIds[Math.floor(Math.random() * unlockedIds.length)];
      setCurrentAnim(next);
    };
    pick();
    rotateRef.current = setInterval(pick, 45_000);
    return () => clearInterval(rotateRef.current);
  }, [selected, totalPomodoros]); // eslint-disable-line react-hooks/exhaustive-deps

  const setActivity = useCallback((id) => {
    setSelected(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch { /* */ }
  }, []);

  const animDef = IDLE_ANIMATIONS.find((a) => a.id === currentAnim) || IDLE_ANIMATIONS[0];

  return {
    selected,       // 'auto' or a specific id
    currentAnim,    // the currently displayed animation id
    animDef,        // full definition of current animation
    unlocked,       // array of unlocked animation defs
    setActivity,    // set 'auto' or pin a specific id
    totalAvailable: IDLE_ANIMATIONS.length,
    totalUnlocked: unlocked.length,
  };
}
