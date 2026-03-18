import { useState } from 'react';

const STORAGE_KEY = 'openpat-affinity';

export function useAffinity() {
  const [affinity, setAffinity] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed)) {
        return Math.min(100, Math.max(0, parsed));
      }
    }
    return 0;
  });

  const addAffinity = (amount) => {
    setAffinity((prev) => {
      const next = Math.min(100, Math.max(0, prev + amount));
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  const isHappy = affinity >= 70;

  return { affinity, addAffinity, isHappy };
}
