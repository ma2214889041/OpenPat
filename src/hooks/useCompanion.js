import { useState, useCallback, useMemo } from 'react';
import { STATES } from '../utils/states';

const PET_KEY = 'openpat-companion';

function loadCompanion() {
  try {
    const raw = localStorage.getItem(PET_KEY);
    if (!raw) return { petName: '', onboarded: false };
    return JSON.parse(raw);
  } catch { return { petName: '', onboarded: false }; }
}

function saveCompanion(data) {
  try { localStorage.setItem(PET_KEY, JSON.stringify(data)); } catch { /* full */ }
}

/**
 * Maps pomodoro phase → existing STATES values (reuses all animations).
 */
function pomodoroToStatus(phase, paused) {
  if (paused) return STATES.IDLE;
  switch (phase) {
    case 'working':    return STATES.THINKING;
    case 'shortBreak': return STATES.DONE;
    case 'longBreak':  return STATES.DONE;
    default:           return STATES.IDLE;
  }
}

/**
 * Maps time-of-day mood → STATES for ambient mode.
 */
function moodToStatus(mood) {
  switch (mood) {
    case 'asleep':    return STATES.OFFLINE;
    case 'sleepy':    return STATES.IDLE;
    case 'energetic': return STATES.IDLE;
    default:          return STATES.IDLE;
  }
}

/**
 * Orchestrator: merges pomodoro, todo, time-awareness, and optional agent
 * into a single pet state.
 *
 * Priority:
 * 1. Agent gateway (if connected & not idle)
 * 2. Task just completed flash (brief TOOL_CALL)
 * 3. Pomodoro phase
 * 4. Time-of-day ambient
 */
export function useCompanion({ pomodoroPhase, paused, gatewayConnected, gatewayStatus, timeMood, taskFlash }) {
  const [companion, setCompanion] = useState(loadCompanion);

  const petName = companion.petName || '小龙';
  const isFirstVisit = !companion.onboarded;

  const renamePet = useCallback((name) => {
    setCompanion((prev) => {
      const updated = { ...prev, petName: name || '小龙' };
      saveCompanion(updated);
      return updated;
    });
  }, []);

  const setOnboarded = useCallback(() => {
    setCompanion((prev) => {
      const updated = { ...prev, onboarded: true };
      saveCompanion(updated);
      return updated;
    });
  }, []);

  // Determine display status and source
  const { displayStatus, source } = useMemo(() => {
    // 1. Agent override (if connected and actively doing something)
    if (gatewayConnected && gatewayStatus && gatewayStatus !== STATES.IDLE) {
      return { displayStatus: gatewayStatus, source: 'agent' };
    }

    // 2. Task completion flash (brief TOOL_CALL animation)
    if (taskFlash) {
      return { displayStatus: STATES.TOOL_CALL, source: 'pomodoro' };
    }

    // 3. Pomodoro-driven
    if (pomodoroPhase !== 'idle') {
      return { displayStatus: pomodoroToStatus(pomodoroPhase, paused), source: 'pomodoro' };
    }

    // 4. Time-awareness ambient
    return { displayStatus: moodToStatus(timeMood), source: 'ambient' };
  }, [gatewayConnected, gatewayStatus, taskFlash, pomodoroPhase, paused, timeMood]);

  return {
    petName,
    isFirstVisit,
    renamePet,
    setOnboarded,
    displayStatus,
    source,
  };
}
