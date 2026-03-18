import { useState, useEffect, useRef, useCallback } from 'react';
import {
  saveSkin,
  loadAllSkins,
  deleteSkin,
  saveAchievementDef,
  loadAllAchievementDefs,
  deleteAchievementDef,
  prepareSkinForDisplay,
} from '../utils/skinStorage';
import AnimatedPet from '../components/AnimatedPet';
import { STATES } from '../hooks/useGateway';
import './AdminSkins.css';

// ─── Constants ───────────────────────────────────────────────────────────────

const FRAME_STATES = ['idle', 'happy', 'thinking', 'tool_call', 'done', 'error', 'offline', 'react'];

const RARITY_OPTIONS = ['common', 'rare', 'epic', 'legendary'];

const UNLOCK_TYPES = [
  { value: 'first_connect', label: '首次连接', needsThreshold: false },
  { value: 'first_tool', label: '首次工具调用', needsThreshold: false },
  { value: 'tasks', label: '完成N个任务', needsThreshold: true },
  { value: 'tokens', label: '消耗N个Token', needsThreshold: true },
  { value: 'night_owl', label: '凌晨工作', needsThreshold: false },
  { value: 'marathon', label: '24小时连续', needsThreshold: false },
  { value: 'no_error_week', label: '整周无错误', needsThreshold: false },
  { value: 'skins', label: '使用N种皮肤', needsThreshold: true },
  { value: 'shares', label: '分享N次', needsThreshold: true },
  { value: 'days', label: '活跃N天', needsThreshold: true },
  { value: 'tools', label: '使用N种工具', needsThreshold: true },
];

// Map frame state name → STATES constant for preview
const STATE_PREVIEW_MAP = {
  idle: STATES.IDLE,
  happy: STATES.IDLE,
  thinking: STATES.THINKING,
  tool_call: STATES.TOOL_CALL,
  done: STATES.DONE,
  error: STATES.ERROR,
  offline: STATES.OFFLINE,
  react: STATES.IDLE,
};

function emptyFrames() {
  return Object.fromEntries(FRAME_STATES.map((s) => [s, []]));
}

function newSkin() {
  return {
    id: crypto.randomUUID(),
    name: '新皮肤',
    emoji: '🦞',
    art_style: '',
    rarity: 'common',
    description: '',
    is_active: false,
    unlock_achievement: null,
    frame_duration_ms: 200,
    frames: emptyFrames(),
  };
}

function newAchievement() {
  return {
    id: crypto.randomUUID(),
    name: '新成就',
    desc: '',
    rarity: 'common',
    emoji: '🏆',
    icon_locked: null,
    icon_unlocked: null,
    unlock_type: 'first_connect',
    unlock_threshold: null,
    is_active: true,
  };
}

// ─── Helper: convert blob/file to object URL safely ──────────────────────────

function toObjectURL(blobOrFile) {
  if (!blobOrFile) return null;
  if (typeof blobOrFile === 'string') return blobOrFile;
  return URL.createObjectURL(blobOrFile);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function RarityBadge({ rarity }) {
  return <span className={`rarity-badge rarity-${rarity}`}>{rarity}</span>;
}

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <label className="toggle-switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track">
        <span className="toggle-thumb" />
      </span>
      {label && <span className="toggle-label">{label}</span>}
    </label>
  );
}

// ─── SkinListItem ─────────────────────────────────────────────────────────────

function SkinListItem({ skin, selected, onClick }) {
  return (
    <div
      className={`admin-list-item${selected ? ' selected' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
    >
      <span className="list-item-emoji">{skin.emoji || '🦞'}</span>
      <span className="list-item-name">{skin.name}</span>
      <RarityBadge rarity={skin.rarity} />
      <span className={`active-dot ${skin.is_active ? 'active' : 'inactive'}`} title={skin.is_active ? '已启用' : '未启用'} />
    </div>
  );
}

// ─── FrameUploader ────────────────────────────────────────────────────────────

function FrameUploader({ stateKey, frames, onAdd, onRemove }) {
  const inputRef = useRef(null);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    onAdd(stateKey, files);
    e.target.value = '';
  };

  const frameCount = frames.length;

  return (
    <div className="frame-uploader">
      <div className="frame-uploader-header">
        <span className="frame-count-badge">{frameCount} 帧</span>
        <button
          type="button"
          className="btn-upload-frames"
          onClick={() => inputRef.current?.click()}
        >
          + 上传帧
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/gif,image/webp"
          multiple
          style={{ display: 'none' }}
          onChange={handleFiles}
        />
      </div>
      {frameCount > 0 && (
        <div className="frames-grid">
          {frames.map((frame, i) => {
            const src = toObjectURL(frame);
            return (
              <div key={i} className="frame-thumb">
                <img src={src} alt={`frame ${i}`} draggable={false} />
                <span className="frame-index">{i}</span>
                <button
                  type="button"
                  className="frame-delete"
                  onClick={() => onRemove(stateKey, i)}
                  title="删除此帧"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── IconUploadArea ───────────────────────────────────────────────────────────

function IconUploadArea({ label, value, onChange, dim }) {
  const inputRef = useRef(null);
  const previewSrc = value ? toObjectURL(value) : null;

  return (
    <div
      className={`icon-upload-area${dim ? ' icon-dim' : ''}`}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
      title={label}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/gif,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onChange(file);
          e.target.value = '';
        }}
      />
      {previewSrc ? (
        <img src={previewSrc} alt={label} className="icon-preview-img" />
      ) : (
        <span className="icon-upload-placeholder">+</span>
      )}
      <span className="icon-upload-label">{label}</span>
    </div>
  );
}

// ─── AchievementListItem ──────────────────────────────────────────────────────

function AchievementListItem({ ach, selected, onClick }) {
  return (
    <div
      className={`admin-list-item${selected ? ' selected' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
    >
      <span className="list-item-emoji">{ach.emoji || '🏆'}</span>
      <span className="list-item-name">{ach.name}</span>
      <RarityBadge rarity={ach.rarity} />
    </div>
  );
}

// ─── Skin Editor ──────────────────────────────────────────────────────────────

function SkinEditor({ skin, onSave, onDelete }) {
  const [form, setForm] = useState(skin);
  const [activeFrameState, setActiveFrameState] = useState('idle');
  const [previewState, setPreviewState] = useState('idle');
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const [previewSkin, setPreviewSkin] = useState(null);

  // Sync form when skin changes (e.g. selecting a different skin)
  useEffect(() => {
    setForm(skin);
    setActiveFrameState('idle');
    setPreviewState('idle');
    setSaveStatus('idle');
  }, [skin.id]);

  // Rebuild preview skin whenever frames or key props change
  useEffect(() => {
    let cancelled = false;
    async function buildPreview() {
      try {
        const prepared = await prepareSkinForDisplay(form);
        if (!cancelled) setPreviewSkin(prepared);
      } catch {
        // ignore
      }
    }
    buildPreview();
    return () => { cancelled = true; };
  }, [form.frames, form.frame_duration_ms, form.art_style, form.name]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleAddFrames = useCallback((stateKey, files) => {
    setForm((f) => ({
      ...f,
      frames: {
        ...f.frames,
        [stateKey]: [...(f.frames[stateKey] || []), ...files],
      },
    }));
  }, []);

  const handleRemoveFrame = useCallback((stateKey, index) => {
    setForm((f) => ({
      ...f,
      frames: {
        ...f.frames,
        [stateKey]: f.frames[stateKey].filter((_, i) => i !== index),
      },
    }));
  }, []);

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await onSave(form);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('保存皮肤失败:', err);
      setSaveStatus('idle');
      alert('保存失败: ' + err.message);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`确认删除皮肤「${form.name}」？此操作不可撤销。`)) {
      onDelete(form.id);
    }
  };

  const previewStatus = STATE_PREVIEW_MAP[previewState] ?? STATES.IDLE;
  const isHappyPreview = previewState === 'happy';

  return (
    <div className="admin-editor">
      {/* ── Basic Info ─────────────────────────────── */}
      <div className="form-section">
        <h3 className="section-title">基本信息</h3>

        <div className="form-row">
          <div className="form-group flex-2">
            <label>皮肤名称</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="皮肤名称"
            />
          </div>
          <div className="form-group flex-1">
            <label>Emoji</label>
            <input
              type="text"
              value={form.emoji}
              onChange={(e) => setField('emoji', e.target.value.slice(0, 2))}
              placeholder="🦞"
              maxLength={2}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group flex-2">
            <label>艺术风格</label>
            <input
              type="text"
              value={form.art_style}
              onChange={(e) => setField('art_style', e.target.value)}
              placeholder="8-bit, tamagotchi, cyberpunk, 水墨..."
            />
          </div>
          <div className="form-group flex-1">
            <label>稀有度</label>
            <select value={form.rarity} onChange={(e) => setField('rarity', e.target.value)}>
              {RARITY_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>描述</label>
          <textarea
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="皮肤描述..."
            rows={2}
          />
        </div>

        <div className="form-row">
          <div className="form-group flex-2">
            <label>解锁成就 ID <span className="label-hint">（留空表示默认解锁）</span></label>
            <input
              type="text"
              value={form.unlock_achievement || ''}
              onChange={(e) => setField('unlock_achievement', e.target.value || null)}
              placeholder="输入成就ID或留空"
            />
          </div>
          <div className="form-group flex-1">
            <label>帧间隔 ms</label>
            <input
              type="number"
              value={form.frame_duration_ms}
              onChange={(e) => setField('frame_duration_ms', Math.max(50, Math.min(1000, Number(e.target.value))))}
              min={50}
              max={1000}
              step={50}
            />
          </div>
        </div>

        <div className="form-row align-center">
          <ToggleSwitch
            checked={form.is_active}
            onChange={(v) => setField('is_active', v)}
            label="已启用"
          />
        </div>
      </div>

      {/* ── Frame Upload ────────────────────────────── */}
      <div className="form-section">
        <h3 className="section-title">帧图片管理</h3>

        <div className="state-tabs">
          {FRAME_STATES.map((s) => (
            <button
              key={s}
              type="button"
              className={`state-tab${activeFrameState === s ? ' active' : ''}`}
              onClick={() => setActiveFrameState(s)}
            >
              {s}
              {form.frames[s]?.length > 0 && (
                <span className="state-tab-count">{form.frames[s].length}</span>
              )}
            </button>
          ))}
        </div>

        <FrameUploader
          stateKey={activeFrameState}
          frames={form.frames[activeFrameState] || []}
          onAdd={handleAddFrames}
          onRemove={handleRemoveFrame}
        />
      </div>

      {/* ── Preview ─────────────────────────────────── */}
      <div className="form-section">
        <h3 className="section-title">预览</h3>
        <div className="preview-area">
          <div className="preview-pet-wrap">
            {previewSkin ? (
              <AnimatedPet
                skin={previewSkin}
                status={previewStatus}
                isHappy={isHappyPreview}
              />
            ) : (
              <div className="preview-placeholder">🦞</div>
            )}
          </div>
          <div className="preview-state-buttons">
            {FRAME_STATES.map((s) => (
              <button
                key={s}
                type="button"
                className={`state-tab${previewState === s ? ' active' : ''}`}
                onClick={() => setPreviewState(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Actions ─────────────────────────────────── */}
      <div className="editor-actions">
        <button
          type="button"
          className="btn-save"
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
        >
          {saveStatus === 'saving' ? '保存中...' : saveStatus === 'saved' ? '已保存 ✓' : '保存'}
        </button>
        <button
          type="button"
          className="btn-delete"
          onClick={handleDelete}
        >
          删除
        </button>
      </div>
    </div>
  );
}

// ─── Achievement Editor ───────────────────────────────────────────────────────

function AchievementEditor({ ach, onSave, onDelete }) {
  const [form, setForm] = useState(ach);
  const [saveStatus, setSaveStatus] = useState('idle');

  useEffect(() => {
    setForm(ach);
    setSaveStatus('idle');
  }, [ach.id]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const selectedType = UNLOCK_TYPES.find((t) => t.value === form.unlock_type);
  const needsThreshold = selectedType?.needsThreshold ?? false;

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await onSave(form);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('保存成就失败:', err);
      setSaveStatus('idle');
      alert('保存失败: ' + err.message);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`确认删除成就「${form.name}」？此操作不可撤销。`)) {
      onDelete(form.id);
    }
  };

  return (
    <div className="admin-editor">
      {/* ── Basic Info ─────────────────────────────── */}
      <div className="form-section">
        <h3 className="section-title">成就信息</h3>

        <div className="form-row">
          <div className="form-group flex-2">
            <label>成就名称</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="成就名称"
            />
          </div>
          <div className="form-group flex-1">
            <label>Emoji</label>
            <input
              type="text"
              value={form.emoji}
              onChange={(e) => setField('emoji', e.target.value.slice(0, 2))}
              placeholder="🏆"
              maxLength={2}
            />
          </div>
        </div>

        <div className="form-group">
          <label>描述</label>
          <textarea
            value={form.desc}
            onChange={(e) => setField('desc', e.target.value)}
            placeholder="成就描述..."
            rows={2}
          />
        </div>

        <div className="form-row">
          <div className="form-group flex-1">
            <label>稀有度</label>
            <select value={form.rarity} onChange={(e) => setField('rarity', e.target.value)}>
              {RARITY_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="form-group flex-2">
            <label>解锁条件</label>
            <select
              value={form.unlock_type}
              onChange={(e) => {
                const type = e.target.value;
                const typeInfo = UNLOCK_TYPES.find((t) => t.value === type);
                setField('unlock_type', type);
                if (!typeInfo?.needsThreshold) setField('unlock_threshold', null);
              }}
            >
              {UNLOCK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          {needsThreshold && (
            <div className="form-group flex-1">
              <label>阈值 N</label>
              <input
                type="number"
                value={form.unlock_threshold ?? ''}
                onChange={(e) => setField('unlock_threshold', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="0"
                min={0}
              />
            </div>
          )}
        </div>

        <div className="form-row align-center">
          <ToggleSwitch
            checked={form.is_active}
            onChange={(v) => setField('is_active', v)}
            label="已启用"
          />
        </div>
      </div>

      {/* ── Icons ──────────────────────────────────── */}
      <div className="form-section">
        <h3 className="section-title">图标</h3>
        <div className="icon-upload-grid">
          <IconUploadArea
            label="锁定图标"
            value={form.icon_locked}
            onChange={(file) => setField('icon_locked', file)}
            dim
          />
          <IconUploadArea
            label="解锁图标"
            value={form.icon_unlocked}
            onChange={(file) => setField('icon_unlocked', file)}
            dim={false}
          />
        </div>
      </div>

      {/* ── Actions ─────────────────────────────────── */}
      <div className="editor-actions">
        <button
          type="button"
          className="btn-save"
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
        >
          {saveStatus === 'saving' ? '保存中...' : saveStatus === 'saved' ? '已保存 ✓' : '保存'}
        </button>
        <button
          type="button"
          className="btn-delete"
          onClick={handleDelete}
        >
          删除
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminSkins() {
  const [activeTab, setActiveTab] = useState('skins'); // 'skins' | 'achievements'

  // Skins state
  const [skins, setSkins] = useState([]);
  const [selectedSkinId, setSelectedSkinId] = useState(null);
  const [skinsLoading, setSkinsLoading] = useState(true);

  // Achievements state
  const [achievements, setAchievements] = useState([]);
  const [selectedAchId, setSelectedAchId] = useState(null);
  const [achLoading, setAchLoading] = useState(true);

  // ── Load data ───────────────────────────────────────────────────────────────

  const refreshSkins = useCallback(async () => {
    setSkinsLoading(true);
    try {
      const raw = await loadAllSkins();
      setSkins(raw);
    } catch (err) {
      console.error('加载皮肤失败:', err);
    } finally {
      setSkinsLoading(false);
    }
  }, []);

  const refreshAchievements = useCallback(async () => {
    setAchLoading(true);
    try {
      const data = await loadAllAchievementDefs();
      setAchievements(data);
    } catch (err) {
      console.error('加载成就失败:', err);
    } finally {
      setAchLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSkins();
    refreshAchievements();
  }, [refreshSkins, refreshAchievements]);

  // ── Skin handlers ───────────────────────────────────────────────────────────

  const handleNewSkin = () => {
    const skin = newSkin();
    setSkins((prev) => [skin, ...prev]);
    setSelectedSkinId(skin.id);
  };

  const handleSaveSkin = async (form) => {
    await saveSkin(form);
    setSkins((prev) => {
      const idx = prev.findIndex((s) => s.id === form.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = form;
        return next;
      }
      return [form, ...prev];
    });
  };

  const handleDeleteSkin = async (id) => {
    await deleteSkin(id);
    setSkins((prev) => prev.filter((s) => s.id !== id));
    setSelectedSkinId(null);
  };

  // ── Achievement handlers ────────────────────────────────────────────────────

  const handleNewAchievement = () => {
    const ach = newAchievement();
    setAchievements((prev) => [ach, ...prev]);
    setSelectedAchId(ach.id);
  };

  const handleSaveAchievement = async (form) => {
    await saveAchievementDef(form);
    setAchievements((prev) => {
      const idx = prev.findIndex((a) => a.id === form.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = form;
        return next;
      }
      return [form, ...prev];
    });
  };

  const handleDeleteAchievement = async (id) => {
    await deleteAchievementDef(id);
    setAchievements((prev) => prev.filter((a) => a.id !== id));
    setSelectedAchId(null);
  };

  // ── Derived selections ──────────────────────────────────────────────────────

  const selectedSkin = skins.find((s) => s.id === selectedSkinId) ?? null;
  const selectedAch = achievements.find((a) => a.id === selectedAchId) ?? null;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">OpenPat Admin</h1>
      </div>

      {/* Tab bar */}
      <div className="admin-tabs">
        <button
          className={`admin-tab${activeTab === 'skins' ? ' active' : ''}`}
          onClick={() => setActiveTab('skins')}
        >
          🎨 皮肤管理
        </button>
        <button
          className={`admin-tab${activeTab === 'achievements' ? ' active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          🏆 成就管理
        </button>
      </div>

      {/* ── Skins Tab ─────────────────────────────────────────────────────────── */}
      {activeTab === 'skins' && (
        <div className="admin-content">
          {/* Left: list */}
          <div className="admin-list">
            <button className="btn-new" onClick={handleNewSkin}>+ 新建皮肤</button>
            {skinsLoading ? (
              <div className="list-loading">加载中...</div>
            ) : skins.length === 0 ? (
              <div className="list-empty">暂无皮肤</div>
            ) : (
              skins.map((skin) => (
                <SkinListItem
                  key={skin.id}
                  skin={skin}
                  selected={skin.id === selectedSkinId}
                  onClick={() => setSelectedSkinId(skin.id)}
                />
              ))
            )}
          </div>

          {/* Right: editor */}
          <div className="admin-editor-wrap">
            {selectedSkin ? (
              <SkinEditor
                key={selectedSkin.id}
                skin={selectedSkin}
                onSave={handleSaveSkin}
                onDelete={handleDeleteSkin}
              />
            ) : (
              <div className="admin-empty-state">
                <span className="empty-icon">🎨</span>
                <p>选择或创建皮肤</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Achievements Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'achievements' && (
        <div className="admin-content">
          {/* Left: list */}
          <div className="admin-list">
            <button className="btn-new" onClick={handleNewAchievement}>+ 新建成就</button>
            {achLoading ? (
              <div className="list-loading">加载中...</div>
            ) : achievements.length === 0 ? (
              <div className="list-empty">暂无成就</div>
            ) : (
              achievements.map((ach) => (
                <AchievementListItem
                  key={ach.id}
                  ach={ach}
                  selected={ach.id === selectedAchId}
                  onClick={() => setSelectedAchId(ach.id)}
                />
              ))
            )}
          </div>

          {/* Right: editor */}
          <div className="admin-editor-wrap">
            {selectedAch ? (
              <AchievementEditor
                key={selectedAch.id}
                ach={selectedAch}
                onSave={handleSaveAchievement}
                onDelete={handleDeleteAchievement}
              />
            ) : (
              <div className="admin-empty-state">
                <span className="empty-icon">🏆</span>
                <p>选择或创建成就</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
