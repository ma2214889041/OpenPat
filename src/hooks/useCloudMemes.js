import { useState, useEffect } from 'react';
import { loadAllMemesFromCloud } from '../utils/supabaseStorage';

/**
 * Loads cloud memes once on mount. Returns { cloudMemes }.
 * Used by Home, PublicProfile, and anywhere memes are displayed.
 */
export function useCloudMemes() {
  const [cloudMemes, setCloudMemes] = useState({});

  useEffect(() => {
    loadAllMemesFromCloud()
      .then(setCloudMemes)
      .catch((err) => console.error('[useCloudMemes] failed:', err));
  }, []);

  return { cloudMemes };
}
