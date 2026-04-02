import { useEffect, useRef } from 'react';
import { apiGet, apiPut } from '../utils/api';
import { loadData, saveData, getLevel } from '../utils/storage';

const DEBOUNCE_MS = 8000;

/**
 * Bidirectional sync with D1 profiles table via Pages Functions.
 */
export function useProfileSync(user, localData) {
  const timerRef      = useRef(null);
  const lastSyncedRef = useRef(null);
  const didPullRef    = useRef(false);

  // ── Pull on login ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) {
      didPullRef.current = false;
      return;
    }

    if (didPullRef.current) return;
    didPullRef.current = true;

    (async () => {
      try {
        const remote = await apiGet('/api/profile');
        if (!remote || remote.error) return;

        const local      = loadData();
        const localTotal = (local.totalTokensInput ?? 0) + (local.totalTokensOutput ?? 0);
        const remoteTotal = (remote.total_tokens_input ?? 0) + (remote.total_tokens_output ?? 0);
        const remoteAch   = Array.isArray(remote.achievements) ? remote.achievements : [];
        const tokenDiff   = remoteTotal - localTotal;

        const merged = {
          ...local,
          totalTasks:       Math.max(local.totalTasks      ?? 0, remote.total_tasks      ?? 0),
          totalToolCalls:   Math.max(local.totalToolCalls  ?? 0, remote.total_tool_calls ?? 0),
          totalTokensInput: Math.max(
            local.totalTokensInput ?? 0,
            tokenDiff > 0 ? (local.totalTokensInput ?? 0) + tokenDiff : (local.totalTokensInput ?? 0)
          ),
          achievements: [...new Set([...(local.achievements ?? []), ...remoteAch])],
        };

        saveData(merged);
        window.dispatchEvent(new Event('openpat-sync'));
      } catch (err) {
        console.warn('[useProfileSync] pull failed:', err);
      }
    })();
  }, [user?.id]);

  // ── Push (debounced) ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const username = user.user_metadata?.user_name
      || user.user_metadata?.preferred_username
      || user.user_metadata?.name
      || user.email?.split('@')[0]
      || `user_${user.id.substring(0, 8)}`;

    const payload = {
      id:                   user.id,
      username,
      total_tasks:          localData.totalTasks,
      total_tool_calls:     localData.totalToolCalls,
      total_tokens_input:   localData.totalTokensInput  ?? 0,
      total_tokens_output:  localData.totalTokensOutput ?? 0,
      achievements:         localData.achievements ?? [],
      level:                getLevel(localData.totalTasks),
      updated_at:           new Date().toISOString(),
    };

    const key = JSON.stringify({
      total_tasks:         payload.total_tasks,
      total_tool_calls:    payload.total_tool_calls,
      total_tokens_input:  payload.total_tokens_input,
      total_tokens_output: payload.total_tokens_output,
      achievements:        payload.achievements,
    });

    if (key === lastSyncedRef.current) return;

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        await apiPut('/api/profile', payload);
        lastSyncedRef.current = key;
      } catch (err) {
        console.warn('[useProfileSync] push failed:', err);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timerRef.current);
  }, [
    user?.id,
    localData.totalTasks,
    localData.totalToolCalls,
    localData.totalTokensInput,
    localData.totalTokensOutput,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    localData.achievements?.join(','),
  ]);
}
