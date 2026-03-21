import { useEffect, useRef } from 'react';
import { supabase, hasSupabase } from '../utils/supabase';
import { loadData, saveData, getLevel } from '../utils/storage';

const DEBOUNCE_MS = 8000; // 8s debounce — no need to hammer Supabase

/**
 * Bidirectional sync with Supabase profiles table.
 *
 * On login: pulls remote data and merges with local (max values for numbers,
 * union for achievements) so switching devices never overwrites progress.
 *
 * Ongoing: debounced push of localData to Supabase.
 */
export function useProfileSync(user, localData) {
  const timerRef      = useRef(null);
  const lastSyncedRef = useRef(null); // JSON string of last pushed payload
  const didPullRef    = useRef(false); // pull once per login session

  // ── Pull on login ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasSupabase || !user?.id) {
      didPullRef.current = false; // reset when logged out
      return;
    }

    if (didPullRef.current) return;
    didPullRef.current = true;

    (async () => {
      try {
        const { data: remote } = await supabase
          .from('profiles')
          .select('total_tasks, total_tool_calls, total_tokens_input, total_tokens_output, achievements')
          .eq('id', user.id)
          .single();

        if (!remote) return; // new account, nothing to pull

        const local      = loadData();
        const localTotal = (local.totalTokensInput ?? 0) + (local.totalTokensOutput ?? 0);
        // Support both old schema (total_tokens) and new schema (split columns)
        const remoteTotal = (remote.total_tokens_input ?? 0) + (remote.total_tokens_output ?? 0)
          || (remote.total_tokens ?? 0);
        const remoteAch   = Array.isArray(remote.achievements) ? remote.achievements : [];
        const tokenDiff   = remoteTotal - localTotal;

        const merged = {
          ...local,
          totalTasks:       Math.max(local.totalTasks      ?? 0, remote.total_tasks      ?? 0),
          totalToolCalls:   Math.max(local.totalToolCalls  ?? 0, remote.total_tool_calls ?? 0),
          // Take the higher of local vs remote for each token bucket
          totalTokensInput: Math.max(
            local.totalTokensInput ?? 0,
            tokenDiff > 0 ? (local.totalTokensInput ?? 0) + tokenDiff : (local.totalTokensInput ?? 0)
          ),
          achievements: [...new Set([...(local.achievements ?? []), ...remoteAch])],
        };

        saveData(merged);
        // Signal Home.jsx (and any other consumer) to reload from localStorage
        window.dispatchEvent(new Event('openpat-sync'));
      } catch (err) {
        console.warn('[useProfileSync] pull failed:', err);
      }
    })();
  }, [user?.id]);

  // ── Push (debounced) ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasSupabase || !user?.id) return;

    // Derive a username — use metadata or fallback to a stable default
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    localData.achievements?.join(','),
  ]);
}
