import { useState } from 'react';

export const SKINS = [
  {
    id: 'classic',
    name: '经典红虾',
    description: '最原汁原味的赛博龙虾',
    emoji: '🦞',
    colors: {
      primary: '#e8401c',
      secondary: '#c83010',
      shadow: 'rgba(232,64,28,0.35)',
    },
  },
  {
    id: 'cyber',
    name: '赛博龙虾',
    description: '赛博朋克风格，霓虹蓝紫',
    emoji: '🤖',
    colors: {
      primary: '#7c3aed',
      secondary: '#5b21b6',
      shadow: 'rgba(124,58,237,0.4)',
    },
  },
  {
    id: 'pixel',
    name: '像素龙虾',
    description: '8-bit 复古风格',
    emoji: '👾',
    colors: {
      primary: '#f97316',
      secondary: '#ea580c',
      shadow: 'rgba(249,115,22,0.4)',
    },
    pixelated: true,
  },
  {
    id: 'golden',
    name: '黄金龙虾',
    description: '稀有金色传说皮肤',
    emoji: '👑',
    colors: {
      primary: '#f59e0b',
      secondary: '#d97706',
      shadow: 'rgba(245,158,11,0.5)',
    },
  },
  {
    id: 'space',
    name: '太空龙虾',
    description: '星际探索者，深空蓝',
    emoji: '🚀',
    colors: {
      primary: '#0ea5e9',
      secondary: '#0284c7',
      shadow: 'rgba(14,165,233,0.4)',
    },
  },
  {
    id: 'guochao',
    name: '国潮龙虾',
    description: '中国风，朱砂红+金',
    emoji: '🐉',
    colors: {
      primary: '#dc2626',
      secondary: '#991b1b',
      shadow: 'rgba(220,38,38,0.5)',
    },
  },
];

// All skins are free — everyone owns all skins
const ALL_IDS = SKINS.map(s => s.id);

export function useSkins() {
  const [activeSkinId, setActiveSkinId] = useState(() => {
    return localStorage.getItem('openpat-active-skin') || 'classic';
  });

  const activeSkin = SKINS.find(s => s.id === activeSkinId) || SKINS[0];

  const selectSkin = (id) => {
    setActiveSkinId(id);
    localStorage.setItem('openpat-active-skin', id);
  };

  // CSS custom properties to inject on the lobster wrapper
  const skinStyle = {
    '--lp': activeSkin.colors.primary,
    '--ls': activeSkin.colors.secondary,
    '--ls-dark': activeSkin.colors.secondary,
    '--lobster-shadow': activeSkin.colors.shadow,
  };

  return {
    activeSkin,
    activeSkinId,
    ownedIds: ALL_IDS,
    setOwnedIds: () => {},
    selectSkin,
    unlockSkin: () => {},
    skinStyle,
  };
}
