import { useEffect, useRef } from 'react';
import {
  saveData, onGatewayConnect, tickUptimeCheck,
  checkAchievements, checkCloudAchievements,
} from '../utils/storage';
import { saveSession } from '../utils/sessionHistory';

/**
 * Tracks session lifecycle: connect/disconnect, uptime ticks, periodic stat checkpoints.
 * Returns nothing — all side effects are internal.
 */
export function useSessionTracking({
  connected, stats, errorLog, addAffinity,
  adminAchDefsRef, setLocalData,
}) {
  const sessionStartRef = useRef(null);
  const prevConnected = useRef(false);
  const statsRef = useRef(stats);
  useEffect(() => { statsRef.current = stats; }, [stats]);

  // ── Session start / end ─────────────────────────────────────────────────
  useEffect(() => {
    if (connected && !prevConnected.current) {
      sessionStartRef.current = Date.now();
      addAffinity(10);
      setLocalData((prev) => {
        const updated = onGatewayConnect(prev);
        const withBuiltin = checkAchievements(updated, {});
        const withAch = checkCloudAchievements(withBuiltin, adminAchDefsRef.current);
        saveData(withAch);
        return withAch;
      });
    }

    if (!connected && prevConnected.current && sessionStartRef.current) {
      saveSession({
        startTime: sessionStartRef.current,
        tokensInput: stats.tokensInput,
        tokensOutput: stats.tokensOutput,
        toolCalls: stats.toolCalls,
        toolCallsSuccess: stats.toolCallsSuccess,
        errorCount: errorLog.length,
        modelName: stats.modelName,
        status: 'disconnected',
      });
      setLocalData((prev) => {
        const today = new Date().toDateString();
        const base = prev.todayDate === today
          ? prev
          : { ...prev, todayTokensInput: 0, todayTokensOutput: 0, todayDate: today };
        const alreadyIn    = prev._flushedTokensIn    ?? 0;
        const alreadyOut   = prev._flushedTokensOut   ?? 0;
        const alreadyTools = prev._flushedToolCalls   ?? 0;
        const remainIn    = Math.max(0, stats.tokensInput  - alreadyIn);
        const remainOut   = Math.max(0, stats.tokensOutput - alreadyOut);
        const remainTools = Math.max(0, stats.toolCalls    - alreadyTools);
        const updated = {
          ...base,
          todayTokensInput:  base.todayTokensInput  + stats.tokensInput,
          todayTokensOutput: base.todayTokensOutput + stats.tokensOutput,
          totalToolCalls:    base.totalToolCalls    + remainTools,
          totalTokensInput:  base.totalTokensInput  + remainIn,
          totalTokensOutput: base.totalTokensOutput + remainOut,
          _flushedTokensIn:  0,
          _flushedTokensOut: 0,
          _flushedToolCalls: 0,
        };
        const withBuiltin2 = checkAchievements(updated, {});
        const withAch = checkCloudAchievements(withBuiltin2, adminAchDefsRef.current);
        saveData(withAch);
        return withAch;
      });
      sessionStartRef.current = null;
    }

    prevConnected.current = connected;
  }, [connected]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Uptime tick (marathon achievement) ─────────────────────────────────
  useEffect(() => {
    if (!connected) return;
    const id = setInterval(() => {
      setLocalData((prev) => {
        const { data: updated, newAch } = tickUptimeCheck(prev);
        if (newAch) saveData(updated);
        return updated;
      });
    }, 60_000);
    return () => clearInterval(id);
  }, [connected]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Periodic session stat checkpoint (every 2 min) ────────────────────
  useEffect(() => {
    if (!connected) return;
    const id = setInterval(() => {
      const s = statsRef.current;
      if (!s.tokensInput && !s.tokensOutput && !s.toolCalls) return;
      setLocalData((prev) => {
        const today = new Date().toDateString();
        const base = prev.todayDate === today
          ? prev
          : { ...prev, todayTokensInput: 0, todayTokensOutput: 0, todayDate: today };
        const alreadyFlushedIn  = prev._flushedTokensIn  ?? 0;
        const alreadyFlushedOut = prev._flushedTokensOut ?? 0;
        const alreadyFlushedTools = prev._flushedToolCalls ?? 0;
        const newIn    = Math.max(0, s.tokensInput  - alreadyFlushedIn);
        const newOut   = Math.max(0, s.tokensOutput - alreadyFlushedOut);
        const newTools = Math.max(0, s.toolCalls    - alreadyFlushedTools);
        if (!newIn && !newOut && !newTools) return prev;
        const updated = {
          ...base,
          totalTokensInput:  base.totalTokensInput  + newIn,
          totalTokensOutput: base.totalTokensOutput + newOut,
          totalToolCalls:    base.totalToolCalls    + newTools,
          _flushedTokensIn:  s.tokensInput,
          _flushedTokensOut: s.tokensOutput,
          _flushedToolCalls: s.toolCalls,
        };
        saveData(updated);
        return updated;
      });
    }, 120_000);
    return () => clearInterval(id);
  }, [connected]); // eslint-disable-line react-hooks/exhaustive-deps
}
