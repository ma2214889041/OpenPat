import { useState, useEffect, useCallback } from 'react';
import {
  saveSkin,
  loadAllSkins,
  deleteSkin,
} from '../utils/skinStorage';
import {
  saveMemeToCloud,
  updateMemeCaptionInCloud,
  loadAllMemesFromCloud,
  deleteMemeFromCloud,
  saveAchievementToCloud,
  loadAllAchievementsFromCloud,
  deleteAchievementFromCloud,
} from '../utils/supabaseStorage';
import SkinTab, { newSkin } from '../components/admin/SkinTab';
import AchievementTab, { newAchievement } from '../components/admin/AchievementTab';
import MemeTab from '../components/admin/MemeTab';
import SiteConfigTab from '../components/admin/SiteConfigTab';
import './AdminSkins.css';

const TABS = [
  { key: 'skins', label: '🎨 皮肤管理' },
  { key: 'achievements', label: '🏆 成就管理' },
  { key: 'memes', label: '😂 状态梗图' },
  { key: 'site', label: '🎬 站点素材' },
];

export default function AdminSkins() {
  const [activeTab, setActiveTab] = useState('skins');

  // Skins state
  const [skins, setSkins] = useState([]);
  const [selectedSkinId, setSelectedSkinId] = useState(null);
  const [skinsLoading, setSkinsLoading] = useState(true);

  // Achievements state
  const [achievements, setAchievements] = useState([]);
  const [selectedAchId, setSelectedAchId] = useState(null);
  const [achLoading, setAchLoading] = useState(true);

  // Memes state
  const [memes, setMemes] = useState({});
  const [memeSaveStatus, setMemeSaveStatus] = useState({});

  // ── Load data ─────────────────────────────────────────────────────────────

  const refreshSkins = useCallback(async () => {
    setSkinsLoading(true);
    try { setSkins(await loadAllSkins()); }
    catch (err) { console.error('加载皮肤失败:', err); }
    finally { setSkinsLoading(false); }
  }, []);

  const refreshAchievements = useCallback(async () => {
    setAchLoading(true);
    try { setAchievements(await loadAllAchievementsFromCloud()); }
    catch (err) { console.error('加载成就失败:', err); }
    finally { setAchLoading(false); }
  }, []);

  const refreshMemes = useCallback(async () => {
    try { setMemes(await loadAllMemesFromCloud()); }
    catch (err) { console.error('加载梗图失败:', err); }
  }, []);

  useEffect(() => {
    refreshSkins();
    refreshAchievements();
    refreshMemes();
  }, [refreshSkins, refreshAchievements, refreshMemes]);

  // ── Skin handlers ─────────────────────────────────────────────────────────

  const handleNewSkin = () => {
    const skin = newSkin();
    setSkins((prev) => [skin, ...prev]);
    setSelectedSkinId(skin.id);
  };

  const handleSaveSkin = async (form) => {
    await saveSkin(form);
    setSkins((prev) => {
      const idx = prev.findIndex((s) => s.id === form.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = form; return next; }
      return [form, ...prev];
    });
  };

  const handleDeleteSkin = async (id) => {
    await deleteSkin(id);
    setSkins((prev) => prev.filter((s) => s.id !== id));
    setSelectedSkinId(null);
  };

  // ── Achievement handlers ──────────────────────────────────────────────────

  const handleNewAchievement = () => {
    const ach = newAchievement();
    setAchievements((prev) => [ach, ...prev]);
    setSelectedAchId(ach.id);
  };

  const handleSaveAchievement = async (form) => {
    const saved = await saveAchievementToCloud(form);
    setAchievements((prev) => {
      const idx = prev.findIndex((a) => a.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [saved, ...prev];
    });
  };

  const handleDeleteAchievement = async (id) => {
    await deleteAchievementFromCloud(id);
    setAchievements((prev) => prev.filter((a) => a.id !== id));
    setSelectedAchId(null);
  };

  // ── Meme handlers ────────────────────────────────────────────────────────

  const handleSaveMeme = async (stateKey, file, caption) => {
    setMemeSaveStatus((s) => ({ ...s, [stateKey]: 'saving' }));
    try {
      let saved;
      if (file) {
        saved = await saveMemeToCloud(stateKey, file, caption);
      } else {
        await updateMemeCaptionInCloud(stateKey, caption);
        saved = { ...memes[stateKey], caption };
      }
      setMemes((prev) => ({ ...prev, [stateKey]: saved }));
      setMemeSaveStatus((s) => ({ ...s, [stateKey]: 'saved' }));
      setTimeout(() => setMemeSaveStatus((s) => ({ ...s, [stateKey]: 'idle' })), 2000);
    } catch (err) {
      console.error('保存梗图失败:', err);
      setMemeSaveStatus((s) => ({ ...s, [stateKey]: 'idle' }));
      alert('保存失败: ' + err.message);
    }
  };

  const handleDeleteMeme = async (stateKey) => {
    await deleteMemeFromCloud(stateKey);
    setMemes((prev) => { const next = { ...prev }; delete next[stateKey]; return next; });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">OpenPat Admin</h1>
      </div>

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`admin-tab${activeTab === t.key ? ' active' : ''}`} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'skins' && (
        <SkinTab skins={skins} selectedId={selectedSkinId} onSelect={setSelectedSkinId}
          onNew={handleNewSkin} onSave={handleSaveSkin} onDelete={handleDeleteSkin} loading={skinsLoading} />
      )}

      {activeTab === 'achievements' && (
        <AchievementTab achievements={achievements} selectedId={selectedAchId} onSelect={setSelectedAchId}
          onNew={handleNewAchievement} onSave={handleSaveAchievement} onDelete={handleDeleteAchievement} loading={achLoading} />
      )}

      {activeTab === 'memes' && (
        <MemeTab memes={memes} saveStatus={memeSaveStatus} onSave={handleSaveMeme} onDelete={handleDeleteMeme} />
      )}

      {activeTab === 'site' && <SiteConfigTab />}
    </div>
  );
}
