import { useState, useEffect, useCallback } from 'react';
import { loadAllSkins, prepareSkinForDisplay } from '../utils/skinStorage';
import { STORAGE_KEYS } from '../utils/constants';

const STORAGE_KEY = STORAGE_KEYS.ACTIVE_ANIMATED_SKIN;

/**
 * Manages animated skins loaded from IndexedDB.
 * Falls back gracefully if no animated skin is selected or IndexedDB is empty.
 */
export function useAnimatedSkin() {
  const [allAnimatedSkins, setAllAnimatedSkins] = useState([]);
  const [activeId, setActiveId] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? null,
  );
  const [activeSkin, setActiveSkin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load all active animated skins from IndexedDB on mount
  useEffect(() => {
    let cancelled = false;

    loadAllSkins()
      .then(async (skins) => {
        if (cancelled) return;
        const active = skins.filter((s) => s.is_active);
        setAllAnimatedSkins(active);

        const current = active.find((s) => s.id === activeId);
        if (current) {
          const prepared = await prepareSkinForDisplay(current);
          if (!cancelled) setActiveSkin(prepared);
        }
      })
      .catch((err) => {
        console.error('[useAnimatedSkin] failed to load skins:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [activeId]);

  const select = useCallback(async (id) => {
    setActiveId(id);
    localStorage.setItem(STORAGE_KEY, id);

    try {
      const skins = await loadAllSkins();
      const skin = skins.find((s) => s.id === id);
      if (skin) {
        const prepared = await prepareSkinForDisplay(skin);
        setActiveSkin(prepared);
      }
    } catch (err) {
      console.error('[useAnimatedSkin] failed to select skin:', err);
    }
  }, []);

  const deselect = useCallback(() => {
    setActiveId(null);
    setActiveSkin(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    allAnimatedSkins,
    activeSkin,   // prepared skin with frames as data URLs (or null)
    activeId,
    select,
    deselect,
    loading,
  };
}
