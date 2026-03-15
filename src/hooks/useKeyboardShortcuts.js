import { useEffect } from 'react';

/**
 * Register keyboard shortcuts for the main lobster view.
 * @param {object} handlers - map of key → callback
 */
export function useKeyboardShortcuts(handlers) {
  useEffect(() => {
    const onKey = (e) => {
      // Ignore when typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') return;
      const key = e.key.toLowerCase();
      if (handlers[key]) {
        e.preventDefault();
        handlers[key](e);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlers]);
}
