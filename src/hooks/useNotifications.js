import { useCallback, useRef } from 'react';

export function useNotifications() {
  const permissionRef = useRef(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return false;
    if (permissionRef.current === 'granted') return true;
    const result = await Notification.requestPermission();
    permissionRef.current = result;
    return result === 'granted';
  }, []);

  const notify = useCallback((title, body, icon = '🦞') => {
    if (typeof Notification === 'undefined') return;
    if (document.visibilityState === 'visible') return; // Only notify when tab is hidden
    if (permissionRef.current !== 'granted') return;
    try {
      const n = new Notification(title, { body, icon: '/favicon.ico' });
      setTimeout(() => n.close(), 5000);
    } catch { /* ignore */ }
  }, []);

  return { requestPermission, notify, permission: permissionRef.current };
}
