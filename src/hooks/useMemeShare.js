import { useState, useCallback } from 'react';
import { DEFAULT_CAPTIONS } from '../utils/constants';
import { STATES } from '../utils/states';
import { generateMemeShareCard } from '../utils/shareCard';

/**
 * Shared meme share logic used by Home and PublicProfile.
 * Downloads a meme PNG based on current status + cloud memes.
 */
export function useMemeShare({ cloudMemes, username, status, onGenerated }) {
  const [sharing, setSharing] = useState(false);

  const handleMemeShare = useCallback(async () => {
    if (sharing) return;
    setSharing(true);
    const stateKey = status ?? STATES.OFFLINE;
    const meme = cloudMemes[stateKey] ?? cloudMemes['idle'] ?? null;
    const caption = meme?.caption || DEFAULT_CAPTIONS[stateKey] || '我的 Agent 正在工作';
    try {
      const dataUrl = await generateMemeShareCard({
        memeImageUrl: meme?.image_url ?? null,
        caption,
        username: username ?? 'agent',
        profileUrl: username ? `openp.at/u/${username}` : 'openp.at',
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `openpat-meme-${stateKey}.png`;
      a.click();
      onGenerated?.();
    } catch (err) {
      console.error('梗图分享失败:', err);
    } finally {
      setSharing(false);
    }
  }, [sharing, status, cloudMemes, username, onGenerated]);

  return { handleMemeShare, sharing };
}
