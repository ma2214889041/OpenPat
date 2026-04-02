import { useState, useEffect, useCallback } from 'react';
import { supabase, hasSupabase } from '../utils/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(hasSupabase);

  useEffect(() => {
    if (!hasSupabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signInWithGitHub = useCallback(async () => {
    if (!hasSupabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/app` },
    });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!hasSupabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app` },
    });
  }, []);

  const signOut = useCallback(async () => {
    if (!hasSupabase) return;
    await supabase.auth.signOut();
  }, []);

  const username = user?.user_metadata?.user_name
    || user?.user_metadata?.name?.toLowerCase().replace(/\s+/g, '_')
    || null;

  return { user, username, loading, signInWithGitHub, signInWithGoogle, signOut };
}
