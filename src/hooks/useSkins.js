import { useState, useEffect } from 'react';
import { supabase, hasSupabase } from '../utils/supabase';

export const SKINS = [
  {
    id: 'default',
    name: '经典红虾',
    description: '最原汁原味的赛博拍拍',
    emoji: '🐾',
    rarity: 'common',
    display_type: 'svg',
    colors: {
      primary: '#e8401c',
      secondary: '#c83010',
      dark: '#b02008',
      shadow: 'rgba(232,64,28,0.35)',
    },
  },
  {
    id: 'cyber',
    name: '赛博拍拍',
    description: '赛博朋克风格，霓虹蓝紫',
    emoji: '🤖',
    rarity: 'rare',
    display_type: 'svg',
    colors: {
      primary: '#7c3aed',
      secondary: '#5b21b6',
      shadow: 'rgba(124,58,237,0.4)',
    },
  },
  {
    id: 'pixel',
    name: '像素拍拍',
    description: '8-bit 复古风格',
    emoji: '👾',
    rarity: 'uncommon',
    display_type: 'svg',
    colors: {
      primary: '#f97316',
      secondary: '#ea580c',
      shadow: 'rgba(249,115,22,0.4)',
    },
    pixelated: true,
  },
  {
    id: 'golden',
    name: '黄金拍拍',
    description: '稀有金色传说皮肤',
    emoji: '👑',
    rarity: 'legendary',
    display_type: 'svg',
    colors: {
      primary: '#f59e0b',
      secondary: '#d97706',
      shadow: 'rgba(245,158,11,0.5)',
    },
  },
  {
    id: 'space',
    name: '太空拍拍',
    description: '星际探索者，深空蓝',
    emoji: '🚀',
    rarity: 'rare',
    display_type: 'svg',
    colors: {
      primary: '#0ea5e9',
      secondary: '#0284c7',
      shadow: 'rgba(14,165,233,0.4)',
    },
  },
  {
    id: 'guochao',
    name: '国潮拍拍',
    description: '中国风，朱砂红+金',
    emoji: '🐉',
    rarity: 'epic',
    display_type: 'svg',
    colors: {
      primary: '#dc2626',
      secondary: '#991b1b',
      shadow: 'rgba(220,38,38,0.5)',
    },
  },
];

export function useSkins() {
  const [activeSkinId, setActiveSkinId] = useState(() => {
    return localStorage.getItem('openpat-active-skin') || 'default';
  });
  const [allSkins, setAllSkins] = useState(SKINS);

  useEffect(() => {
    if (!hasSupabase) return;

    async function fetchCloudSkins() {
      const { data, error } = await supabase
        .from('skins')
        .select('*')
        .eq('is_active', true);

      if (!error && data) {
        // Merge cloud skins with default ones, clouds override defaults if IDs match
        const merged = [...SKINS];
        data.forEach(cloudRecord => {
          const idx = merged.findIndex(s => s.id === cloudRecord.id);
          const formatted = {
            ...cloudRecord,
            emoji: cloudRecord.emoji || '🐾',
            // Ensure colors exists even for image skins for UI styling
            colors: cloudRecord.colors || { primary: '#666', secondary: '#444' }
          };
          if (idx >= 0) {
            merged[idx] = formatted;
          } else {
            merged.push(formatted);
          }
        });
        setAllSkins(merged);
      }
    }

    fetchCloudSkins();
  }, []);

  const activeSkin = allSkins.find(s => s.id === activeSkinId) || allSkins[0];

  const selectSkin = (id) => {
    setActiveSkinId(id);
    localStorage.setItem('openpat-active-skin', id);
  };

  const skinStyle = {
    '--lp': activeSkin?.colors?.primary,
    '--ls': activeSkin?.colors?.secondary,
    '--ls-dark': activeSkin?.colors?.dark || activeSkin?.colors?.secondary,
    '--pet-shadow': activeSkin?.colors?.shadow,
  };

  return {
    activeSkin,
    activeSkinId,
    allSkins,
    ownedIds: allSkins.map(s => s.id),
    setOwnedIds: () => { },
    selectSkin,
    unlockSkin: () => { },
    skinStyle,
  };
}
