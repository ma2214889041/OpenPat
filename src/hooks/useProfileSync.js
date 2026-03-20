import { useEffect, useRef } from 'react';
import { supabase, hasSupabase } from '../utils/supabase';
import { getLevel } from '../utils/storage';

const DEBOUNCE_MS = 8000; // 8s debounce — no need to hammer Supabase

/**
 * Syncs localData to Supabase profiles table when the user is logged in.
 * Debounced: only writes after data has been stable for DEBOUNCE_MS.
 *
 * Required profiles table columns (add if missing):
 *   total_tasks INTEGER, total_tool_calls INTEGER,
 *   total_tokens BIGINT, achievements JSONB, level INTEGER
 */
export function useProfileSync(user, localData) {
  const timerRef = useRef(null);
  const lastSyncedRef = useRef(null); // JSON string of last pushed payload

  useEffect(() => {
    if (!hasSupabase || !user?.id) return;

    const payload = {
      id: user.id,
      total_tasks:      localData.totalTasks,
      total_tool_calls: localData.totalToolCalls,
      total_tokens:     (localData.totalTokensInput ?? 0) + (localData.totalTokensOutput ?? 0),
      achievements:     localData.achievements ?? [],
      level:            getLevel(localData.totalTasks),
      updated_at:       new Date().toISOString(),
    };

    const key = JSON.stringify({
      total_tasks:      payload.total_tasks,
      total_tool_calls: payload.total_tool_calls,
      total_tokens:     payload.total_tokens,
      achievements:     payload.achievements,
    });

    // Skip if nothing changed since last sync
    if (key === lastSyncedRef.current) return;

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('profiles')
          .upsert(payload, { onConflict: 'id' });
        if (!error) lastSyncedRef.current = key;
        else console.warn('[useProfileSync] upsert failed:', error.message);
      } catch (err) {
        console.warn('[useProfileSync] network error:', err);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timerRef.current);
  }, [
    user?.id,
    localData.totalTasks,
    localData.totalToolCalls,
    localData.totalTokensInput,
    localData.totalTokensOutput,
    // achievements array reference changes when new ones unlock
    // eslint-disable-next-line react-hooks/exhaustive-deps
    localData.achievements?.join(','),
  ]);
}
