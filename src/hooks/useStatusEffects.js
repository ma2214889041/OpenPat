import { useEffect, useRef } from 'react';
import { STATES } from '../utils/states';
import { triggerConfetti } from '../components/Confetti';
import {
  saveData, recordError, checkNoErrorWeek,
  checkAchievements, checkCloudAchievements,
} from '../utils/storage';
import { supabase, hasSupabase } from '../utils/supabase';

/**
 * Reacts to status changes: task complete (confetti, achievements), errors,
 * saver achievement, night owl, Supabase sync, and dynamic document title.
 */
export function useStatusEffects({
  status, displayStatus, connected, stats, user, currentTool,
  addAffinity, notify, adminAchDefsRef, setLocalData,
}) {
  const prevStatus = useRef(null);

  // ── Task complete / error ───────────────────────────────────────────────
  useEffect(() => {
    if (status === prevStatus.current) return;
    const prevSt = prevStatus.current;
    prevStatus.current = status;

    if (status === STATES.DONE) {
      triggerConfetti();
      addAffinity(5);
      setLocalData((prev) => {
        const sessionErrors = prev._sessionErrors ?? 0;
        const extras = [];
        if (!prev.achievements.includes('perfect_task') && sessionErrors === 0) {
          extras.push('perfect_task');
        }
        const withWeek = checkNoErrorWeek(prev);
        const updated = {
          ...withWeek,
          totalTasks: withWeek.totalTasks + 1,
          _sessionErrors: 0,
          achievements: [
            ...withWeek.achievements,
            ...extras.filter((id) => !withWeek.achievements.includes(id)),
          ],
        };
        const withBuiltin3 = checkAchievements(updated, {});
        const withAch = checkCloudAchievements(withBuiltin3, adminAchDefsRef.current);
        saveData(withAch);
        return withAch;
      });
      notify('任务完成！', '伙伴完成了一个任务 ✔');
    }

    if (status === STATES.ERROR && prevSt !== STATES.ERROR) {
      setLocalData((prev) => {
        const updated = recordError({ ...prev, _sessionErrors: (prev._sessionErrors ?? 0) + 1 });
        return updated;
      });
      notify('遇到了问题', '不用担心，伙伴还在努力');
    }
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tool calls → saver achievement ─────────────────────────────────────
  useEffect(() => {
    setLocalData((prev) => {
      if (
        !prev.achievements.includes('saver') &&
        stats.toolCalls >= 50 &&
        stats.toolCallsSuccess === stats.toolCalls &&
        stats.tokensInput < 50_000
      ) {
        const updated = { ...prev, achievements: [...prev.achievements, 'saver'] };
        saveData(updated);
        return updated;
      }
      return prev;
    });
  }, [stats.toolCalls]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Night owl ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!connected) return;
    const h = new Date().getHours();
    if (h >= 2 && h < 5) {
      setLocalData((prev) => {
        if (prev.achievements.includes('night_owl')) return prev;
        const updated = { ...prev, achievements: [...prev.achievements, 'night_owl'] };
        saveData(updated);
        return updated;
      });
    }
  }, [connected]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync to Supabase ──────────────────────────────────────────────────
  useEffect(() => {
    if (!hasSupabase || !user || !connected) return;
    supabase.from('agent_status').upsert({
      user_id: user.id,
      status,
      current_tool: currentTool?.name ?? null,
      session_tokens: stats.tokensInput + stats.tokensOutput,
      session_tool_calls: stats.toolCalls,
      updated_at: new Date().toISOString(),
    });
  }, [status, user, connected, currentTool, stats]);

  // ── Dynamic title ─────────────────────────────────────────────────────
  useEffect(() => {
    const titles = {
      [STATES.ERROR]:     '[Error] 出错了',
      [STATES.TOOL_CALL]: '[Working] 正在工作中 ⚡',
      [STATES.DONE]:      '[Done] 任务完成 ✔',
    };
    document.title = titles[displayStatus] ?? 'OpenPat 🦞';
  }, [displayStatus]);
}
