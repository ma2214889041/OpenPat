import { useState, useEffect } from 'react';

export const SKINS = [
  {
    id: 'classic',
    name: '经典红虾',
    price: 0,
    description: '最原汁原味的赛博龙虾',
    emoji: '🦞',
    colors: {
      primary: '#e8401c',
      secondary: '#c83010',
      shadow: 'rgba(232,64,28,0.35)',
      filter: 'none',
    },
  },
  {
    id: 'cyber',
    name: '赛博龙虾',
    price: 4.99,
    description: '赛博朋克风格，霓虹蓝紫',
    emoji: '🤖',
    colors: {
      primary: '#7c3aed',
      secondary: '#5b21b6',
      shadow: 'rgba(124,58,237,0.4)',
      filter: 'hue-rotate(220deg) saturate(1.3) brightness(1.1)',
    },
  },
  {
    id: 'pixel',
    name: '像素龙虾',
    price: 4.99,
    description: '8-bit 复古风格',
    emoji: '👾',
    colors: {
      primary: '#f97316',
      secondary: '#ea580c',
      shadow: 'rgba(249,115,22,0.4)',
      filter: 'contrast(1.4) saturate(1.2)',
    },
    pixelated: true,
  },
  {
    id: 'golden',
    name: '黄金龙虾',
    price: 4.99,
    description: '稀有金色传说皮肤',
    emoji: '👑',
    colors: {
      primary: '#f59e0b',
      secondary: '#d97706',
      shadow: 'rgba(245,158,11,0.5)',
      filter: 'hue-rotate(30deg) saturate(1.5) brightness(1.15)',
    },
  },
  {
    id: 'space',
    name: '太空龙虾',
    price: 4.99,
    description: '星际探索者，深空蓝',
    emoji: '🚀',
    colors: {
      primary: '#0ea5e9',
      secondary: '#0284c7',
      shadow: 'rgba(14,165,233,0.4)',
      filter: 'hue-rotate(180deg) saturate(1.2)',
    },
  },
  {
    id: 'guochao',
    name: '国潮龙虾',
    price: 4.99,
    description: '中国风，朱砂红+金',
    emoji: '🐉',
    colors: {
      primary: '#dc2626',
      secondary: '#991b1b',
      shadow: 'rgba(220,38,38,0.5)',
      filter: 'saturate(1.6) brightness(0.95)',
    },
  },
];

const STORAGE_KEY = 'lobster-pet-skins';

function loadOwned() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '["classic"]');
  } catch { return ['classic']; }
}

function saveOwned(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function useSkins() {
  const [activeSkinId, setActiveSkinId] = useState(() => {
    return localStorage.getItem('lobster-pet-active-skin') || 'classic';
  });
  const [ownedIds, setOwnedIds] = useState(loadOwned);

  const activeSkin = SKINS.find(s => s.id === activeSkinId) || SKINS[0];

  const selectSkin = (id) => {
    if (!ownedIds.includes(id)) return;
    setActiveSkinId(id);
    localStorage.setItem('lobster-pet-active-skin', id);
  };

  // unlock skin after purchase (called after Stripe success)
  const unlockSkin = (id) => {
    setOwnedIds(prev => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      saveOwned(next);
      return next;
    });
  };

  // CSS custom properties to inject on the lobster wrapper
  const skinStyle = {
    '--lp': activeSkin.colors.primary,
    '--ls': activeSkin.colors.secondary,
    '--ls-dark': activeSkin.colors.secondary,
    '--lobster-shadow': activeSkin.colors.shadow,
  };

  return { activeSkin, activeSkinId, ownedIds, setOwnedIds, selectSkin, unlockSkin, skinStyle };
}
