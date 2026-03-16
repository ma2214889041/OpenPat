import { useEffect } from 'react';
import { supabase, hasSupabase } from '../utils/supabase';

/**
 * When the user is logged in, sync their owned skins from Supabase
 * and update the local state + localStorage.
 */
export function useCloudSkins(user, setOwnedIds) {
  useEffect(() => {
    if (!hasSupabase || !user) return;

    // Pull cloud-owned skins
    supabase
      .from('profiles')
      .select('owned_skins')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.owned_skins?.length) {
          setOwnedIds(data.owned_skins);
          localStorage.setItem('openpat-skins', JSON.stringify(data.owned_skins));
        }
      });
  }, [user]); // eslint-disable-line
}
