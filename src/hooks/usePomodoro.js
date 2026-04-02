import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'openpat-pomodoro-data';

const DEFAULT_SETTINGS = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
};

function loadPomodoroData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { totalPomodoros: 0, todayPomodoros: 0, todayDate: null, totalFocusMinutes: 0, todayFocusMinutes: 0, settings: DEFAULT_SETTINGS };
    const data = JSON.parse(raw);
    const today = new Date().toDateString();
    if (data.todayDate !== today) {
      data.todayPomodoros = 0;
      data.todayFocusMinutes = 0;
      data.todayDate = today;
    }
    return { ...{ totalPomodoros: 0, todayPomodoros: 0, todayDate: null, totalFocusMinutes: 0, todayFocusMinutes: 0, settings: DEFAULT_SETTINGS }, ...data };
  } catch {
    return { totalPomodoros: 0, todayPomodoros: 0, todayDate: null, totalFocusMinutes: 0, todayFocusMinutes: 0, settings: DEFAULT_SETTINGS };
  }
}

function savePomodoroData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* full */ }
}

/**
 * Pomodoro timer hook — drives pet state for standalone mode.
 * Phases: idle → working → shortBreak/longBreak → idle
 */
export function usePomodoro() {
  const [pomData, setPomData] = useState(loadPomodoroData);
  const [phase, setPhase] = useState('idle'); // 'idle' | 'working' | 'shortBreak' | 'longBreak'
  const [timeLeft, setTimeLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);
  const onCompleteRef = useRef(null); // callback when pomodoro completes

  const settings = pomData.settings || DEFAULT_SETTINGS;

  const totalSeconds = phase === 'working'
    ? settings.workMinutes * 60
    : phase === 'shortBreak'
      ? settings.shortBreakMinutes * 60
      : phase === 'longBreak'
        ? settings.longBreakMinutes * 60
        : 0;

  // Tick timer
  useEffect(() => {
    if (phase === 'idle' || paused) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [phase, paused]);

  // Phase transition when timer hits 0
  useEffect(() => {
    if (timeLeft > 0 || phase === 'idle') return;

    if (phase === 'working') {
      // Pomodoro completed
      const today = new Date().toDateString();
      setPomData((prev) => {
        const updated = {
          ...prev,
          totalPomodoros: prev.totalPomodoros + 1,
          todayPomodoros: (prev.todayDate === today ? prev.todayPomodoros : 0) + 1,
          todayFocusMinutes: (prev.todayDate === today ? prev.todayFocusMinutes : 0) + settings.workMinutes,
          totalFocusMinutes: prev.totalFocusMinutes + settings.workMinutes,
          todayDate: today,
        };
        savePomodoroData(updated);
        return updated;
      });

      // Notify completion callback
      if (onCompleteRef.current) onCompleteRef.current();

      // Decide break type
      const nextCount = pomData.todayPomodoros + 1;
      if (nextCount % settings.longBreakInterval === 0) {
        setPhase('longBreak');
        setTimeLeft(settings.longBreakMinutes * 60);
      } else {
        setPhase('shortBreak');
        setTimeLeft(settings.shortBreakMinutes * 60);
      }
      setPaused(false);

      // Browser notification
      try {
        if (Notification.permission === 'granted') {
          new Notification('番茄钟完成！', { body: '休息一下吧～', icon: '/favicon.svg' });
        }
      } catch { /* ignore */ }
    } else if (phase === 'shortBreak' || phase === 'longBreak') {
      setPhase('idle');
      try {
        if (Notification.permission === 'granted') {
          new Notification('休息结束！', { body: '准备好继续了吗？', icon: '/favicon.svg' });
        }
      } catch { /* ignore */ }
    }
  }, [timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = useCallback(() => {
    setPhase('working');
    setTimeLeft(settings.workMinutes * 60);
    setPaused(false);
    // Request notification permission
    try { if (Notification.permission === 'default') Notification.requestPermission(); } catch { /* */ }
  }, [settings.workMinutes]);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  const skip = useCallback(() => {
    if (phase === 'working') {
      // Skip work → go idle without counting
      setPhase('idle');
      setTimeLeft(0);
      setPaused(false);
    } else if (phase === 'shortBreak' || phase === 'longBreak') {
      setPhase('idle');
      setTimeLeft(0);
      setPaused(false);
    }
  }, [phase]);

  const reset = useCallback(() => {
    setPhase('idle');
    setTimeLeft(0);
    setPaused(false);
  }, []);

  const updateSettings = useCallback((partial) => {
    setPomData((prev) => {
      const updated = { ...prev, settings: { ...prev.settings, ...partial } };
      savePomodoroData(updated);
      return updated;
    });
  }, []);

  return {
    phase,
    timeLeft,
    totalSeconds,
    paused,
    completedPomodoros: pomData.todayPomodoros,
    totalPomodoros: pomData.totalPomodoros,
    todayFocusMinutes: pomData.todayFocusMinutes,
    totalFocusMinutes: pomData.totalFocusMinutes,
    settings,
    start,
    pause,
    resume,
    skip,
    reset,
    updateSettings,
    onCompleteRef, // parent can assign callback
  };
}
