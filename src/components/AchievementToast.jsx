import { useState, useEffect, useRef } from 'react';
import './AchievementToast.css';
import { ACHIEVEMENTS } from '../utils/storage';

export function useAchievementToast(achievements) {
  const [toast, setToast] = useState(null);
  const prev = useRef(achievements);

  useEffect(() => {
    const newOnes = achievements.filter(id => !prev.current.includes(id));
    if (newOnes.length > 0) {
      const a = ACHIEVEMENTS.find(a => a.id === newOnes[0]);
      if (a) setToast(a);
    }
    prev.current = achievements;
  }, [achievements]);

  const dismiss = () => setToast(null);
  return { toast, dismiss };
}

export default function AchievementToast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className="achievement-toast" onClick={onDismiss}>
      <div className="toast-icon">{toast.emoji}</div>
      <div className="toast-body">
        <div className="toast-title">成就解锁！</div>
        <div className="toast-name">{toast.name}</div>
        <div className="toast-desc">{toast.desc}</div>
      </div>
    </div>
  );
}
