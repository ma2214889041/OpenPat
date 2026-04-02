import { useState, useEffect, useRef, useCallback } from 'react';
import { generateDialogue } from './usePersonality';

/**
 * Proactive chat — the pet talks to you based on personality + context.
 *
 * Now powered by usePersonality's behavior data:
 * - Greetings reference your habits ("比平时早！")
 * - Observations grow with relationship stage
 * - Agent data gets mentioned when connected
 */

// Fallback pools for very early stages (before enough data)
const EARLY_IDLE = [
  '...你在忙什么呢？',
  '今天天气怎么样？',
  '好无聊...戳我一下嘛',
  '该喝水了！',
  '我在这陪着你呢',
];

const WORK_START = [
  '好的！一起加油！',
  '开始专注！我不打扰你了',
  '冲冲冲！',
  '专注模式启动！',
  '你专心工作，我在旁边陪着',
];

const WORK_END = [
  '辛苦了！休息一下吧',
  '完成了！你真棒',
  '太厉害了！',
  '休息时间！去喝口水',
  '好棒好棒！',
];

const TASK_DONE = [
  '划掉了！爽不爽！',
  '又少了一个任务！',
  '完成！继续保持！',
  '这个也搞定了！',
];

const COMEBACK = [
  '你回来啦！我等你好久了',
  '嘿！想我了吗？',
  '你去哪了～我一个人好无聊',
  '欢迎回来！',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return 'morning';
  if (h >= 12 && h < 14) return 'noon';
  if (h >= 14 && h < 18) return 'afternoon';
  if (h >= 18 && h < 23) return 'evening';
  return 'lateNight';
}

/**
 * Proactive chat hook.
 *
 * @param {object} opts
 * @param {string} opts.petName
 * @param {string} opts.pomodoroPhase - 'idle' | 'working' | ...
 * @param {number} opts.completedPomodoros
 * @param {object} opts.personality - profile from usePersonality
 * @param {string} opts.displayStatus
 */
export function useProactiveChat({ petName, pomodoroPhase, completedPomodoros, personality, displayStatus }) {
  const [message, setMessage] = useState(null);
  const timerRef = useRef(null);
  const idleChatRef = useRef(null);
  const hasGreeted = useRef(false);
  const prevPhase = useRef(pomodoroPhase);
  const prevPomodoros = useRef(completedPomodoros);
  const mountTime = useRef(Date.now());

  const showMessage = useCallback((text, duration = 4000) => {
    if (!text) return;
    setMessage(text);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setMessage(null), duration);
  }, []);

  const clearMessage = useCallback(() => {
    setMessage(null);
    clearTimeout(timerRef.current);
  }, []);

  // 1. Initial greeting — personality-driven
  useEffect(() => {
    if (hasGreeted.current) return;
    hasGreeted.current = true;

    const lastVisit = localStorage.getItem('openpat-last-visit');
    const now = Date.now();
    localStorage.setItem('openpat-last-visit', String(now));

    const timeSinceLastVisit = lastVisit ? now - Number(lastVisit) : Infinity;

    setTimeout(() => {
      if (timeSinceLastVisit > 4 * 60 * 60 * 1000) {
        showMessage(pick(COMEBACK), 5000);
      } else if (personality) {
        const dialogue = generateDialogue(personality, {
          timeOfDay: getTimeOfDay(),
          isWorking: false,
          petName,
        });
        showMessage(dialogue?.text || pick(COMEBACK), 5000);
      } else {
        showMessage(`你来了！`, 4000);
      }
    }, 1200);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Phase changes — work start/end
  useEffect(() => {
    if (prevPhase.current === pomodoroPhase) return;
    const prev = prevPhase.current;
    prevPhase.current = pomodoroPhase;

    if (pomodoroPhase === 'working' && prev === 'idle') {
      showMessage(pick(WORK_START));
    } else if ((pomodoroPhase === 'shortBreak' || pomodoroPhase === 'longBreak' || pomodoroPhase === 'idle') && prev === 'working') {
      showMessage(pick(WORK_END), 5000);
    }
  }, [pomodoroPhase, showMessage]);

  // 3. Milestone messages
  useEffect(() => {
    if (completedPomodoros > prevPomodoros.current && completedPomodoros > 0) {
      const milestones = {
        3:  '今天第 3 个番茄了！稳步前进',
        5:  '5 个番茄！你今天效率真高！',
        8:  '8 个番茄...你是工作机器吗？注意休息啊',
        10: '10 个番茄！！你太强了！',
      };
      const text = milestones[completedPomodoros];
      if (text) setTimeout(() => showMessage(text, 5000), 3000);
    }
    prevPomodoros.current = completedPomodoros;
  }, [completedPomodoros, showMessage]);

  // 4. Personality-driven idle chatter
  useEffect(() => {
    if (pomodoroPhase !== 'idle') {
      clearInterval(idleChatRef.current);
      return;
    }
    const delay = Math.max(0, 30_000 - (Date.now() - mountTime.current));
    const startChatter = () => {
      idleChatRef.current = setInterval(() => {
        if (Math.random() > 0.4) return; // 40% chance

        if (personality) {
          const dialogue = generateDialogue(personality, {
            timeOfDay: getTimeOfDay(),
            isWorking: false,
            petName,
          });
          if (dialogue) {
            showMessage(dialogue.text);
            return;
          }
        }
        showMessage(pick(EARLY_IDLE));
      }, 90_000 + Math.random() * 90_000); // 1.5-3 min
    };
    const delayTimer = setTimeout(startChatter, delay);
    return () => {
      clearTimeout(delayTimer);
      clearInterval(idleChatRef.current);
    };
  }, [pomodoroPhase, personality, petName, showMessage]);

  // 5. Work-time personality observations (every ~15 min while working)
  useEffect(() => {
    if (pomodoroPhase !== 'working') return;
    const id = setInterval(() => {
      if (Math.random() > 0.3) return;
      if (personality) {
        const dialogue = generateDialogue(personality, {
          timeOfDay: getTimeOfDay(),
          isWorking: true,
          petName,
        });
        if (dialogue) { showMessage(dialogue.text); return; }
      }
      showMessage('加油！');
    }, 15 * 60 * 1000);
    return () => clearInterval(id);
  }, [pomodoroPhase, personality, petName, showMessage]);

  return { message, showMessage, clearMessage };
}
