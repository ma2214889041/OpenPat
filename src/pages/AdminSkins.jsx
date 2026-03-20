import { useState, useEffect, useRef, useCallback } from 'react';
import {
  saveSkin,
  loadAllSkins,
  deleteSkin,
  prepareSkinForDisplay,
} from '../utils/skinStorage';
import {
  saveMemeToCloud,
  updateMemeCaptionInCloud,
  loadAllMemesFromCloud,
  deleteMemeFromCloud,
  saveAchievementToCloud,
  loadAllAchievementsFromCloud,
  deleteAchievementFromCloud,
  loadSiteConfig,
  setSiteConfig,
} from '../utils/supabaseStorage';
import { hasSupabase } from '../utils/supabase';
import AnimatedPet from '../components/AnimatedPet';
import { STATES } from '../hooks/useGateway';
import './AdminSkins.css';

// ─── Constants ───────────────────────────────────────────────────────────────

const FRAME_STATES = ['idle', 'happy', 'thinking', 'tool_call', 'done', 'error', 'offline', 'react'];

const MEME_STATES = [
  { key: 'idle',            label: '摸鱼中',   emoji: '😴' },
  { key: 'thinking',        label: '深思熟虑', emoji: '🤔' },
  { key: 'tool_call',       label: '调用工具', emoji: '🔧' },
  { key: 'done',            label: '任务完成', emoji: '✅' },
  { key: 'error',           label: '翻车了',   emoji: '💥' },
  { key: 'offline',         label: '下线了',   emoji: '😴' },
  { key: 'token_exhausted', label: 'Token耗尽', emoji: '💸' },
  { key: 'happy',           label: '开心ing',  emoji: '😊' },
];

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
    unlock_caption: '',
    share_caption: '',
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

// ─── Meme Manager ─────────────────────────────────────────────────────────────

function MemeManager({ memes, saveStatus, onSave, onDelete }) {
  const fileRefs = useRef({});
  // draft: { [stateKey]: { file: File|null, caption, previewUrl } }
  const [drafts, setDrafts] = useState(() => {
    const d = {};
    MEME_STATES.forEach(({ key }) => { d[key] = { file: null, caption: '', previewUrl: null }; });
    return d;
  });

  // Sync saved cloud memes into drafts (show existing image_url as preview)
  useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      MEME_STATES.forEach(({ key }) => {
        if (memes[key]) {
          next[key] = {
            file: null,                          // no pending upload
            caption: memes[key].caption ?? '',
            previewUrl: memes[key].image_url ?? null,
          };
        }
      });
      return next;
    });
  }, [memes]);

  const handleFileChange = (stateKey, file) => {
    if (!file) return;
    // Show local preview immediately; store the File object for upload
    const previewUrl = URL.createObjectURL(file);
    setDrafts((prev) => ({
      ...prev,
      [stateKey]: { ...prev[stateKey], file, previewUrl },
    }));
  };

  const handleCaption = (stateKey, val) => {
    setDrafts((prev) => ({ ...prev, [stateKey]: { ...prev[stateKey], caption: val } }));
  };

  const canSave = (stateKey) => {
    const draft = drafts[stateKey];
    // Can save if: new file chosen, OR existing image + caption changed
    return draft.file !== null || (memes[stateKey] && draft.caption !== (memes[stateKey].caption ?? ''));
  };

  return (
    <div className="meme-manager">
      {!hasSupabase && (
        <div className="meme-manager-hint" style={{ borderColor: '#f97316', color: '#f97316' }}>
          ⚠️ 未配置 Supabase，梗图无法保存到云端。请在 .env.local 中配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。
        </div>
      )}
      <p className="meme-manager-hint">
        每个 Agent 状态配一张搞笑图片 + 一句文案，作为分享卡片的背景。
        图片会上传到云端，所有设备共享。建议 1080×1080，支持 PNG / JPG / GIF / WebP（最大 5MB）。
      </p>
      <div className="meme-grid">
        {MEME_STATES.map(({ key, label, emoji }) => {
          const draft = drafts[key];
          const status = saveStatus[key] ?? 'idle';
          const isSaved = !!memes[key];
          return (
            <div key={key} className="meme-card">
              <div className="meme-card-header">
                <span className="meme-state-emoji">{emoji}</span>
                <span className="meme-state-label">{label}</span>
                <span className="meme-state-key">{key}</span>
                {isSaved && <span className="meme-cloud-badge">☁️ 已同步</span>}
              </div>

              {/* Image upload area */}
              <div
                className={`meme-image-area${draft.previewUrl ? ' has-image' : ''}`}
                onClick={() => fileRefs.current[key]?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileRefs.current[key]?.click(); }}
              >
                <input
                  ref={(el) => { fileRefs.current[key] = el; }}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => { handleFileChange(key, e.target.files?.[0]); e.target.value = ''; }}
                />
                {draft.previewUrl ? (
                  <img src={draft.previewUrl} alt={label} className="meme-preview-img" />
                ) : (
                  <div className="meme-upload-placeholder">
                    <span style={{ fontSize: 32 }}>🖼️</span>
                    <span>点击上传梗图</span>
                  </div>
                )}
              </div>

              {/* Caption */}
              <textarea
                className="meme-caption-input"
                value={draft.caption}
                onChange={(e) => handleCaption(key, e.target.value)}
                placeholder="配套文案，比如：它在思考，就像你不会的那些事"
                rows={2}
              />

              {/* Actions */}
              <div className="meme-card-actions">
                <button
                  className="btn-save"
                  disabled={status === 'saving' || !canSave(key) || !hasSupabase}
                  onClick={() => onSave(key, draft.file, draft.caption)}
                >
                  {status === 'saving' ? '上传中...' : status === 'saved' ? '已保存 ✓' : '保存到云端'}
                </button>
                {isSaved && (
                  <button className="btn-delete" onClick={() => onDelete(key)}>
                    删除
                  </button>
                )}
              </div>
            </div>
          );
        })}
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

      {/* ── Caption / Funny Text ────────────────────── */}
      <div className="form-section">
        <h3 className="section-title">搞笑台词</h3>

        <div className="form-group">
          <label>解锁台词 <span className="label-hint">（弹窗里显示的那句话，要搞笑）</span></label>
          <textarea
            value={form.unlock_caption ?? ''}
            onChange={(e) => setField('unlock_caption', e.target.value)}
            placeholder="它睁开了眼睛，看了看世界，然后立刻开始工作..."
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>分享文案 <span className="label-hint">（出现在分享卡片里的那句话）</span></label>
          <textarea
            value={form.share_caption ?? ''}
            onChange={(e) => setField('share_caption', e.target.value)}
            placeholder="我的 Agent 今天正式上岗了。它没有问五险一金..."
            rows={3}
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

// ─── Site Config Manager ──────────────────────────────────────────────────────

const SITE_ASSETS = [
  {
    key:    'hero_video_url',
    label:  '首屏背景视频',
    desc:   '首页 hero 区域的背景视频（mp4）',
    accept: 'video/mp4,video/*',
    type:   'video',
    storagePath: (f) => `site/hero.${f.name.split('.').pop() || 'mp4'}`,
  },
  {
    key:    'about_image_url',
    label:  '关于我们插图',
    desc:   '首页"关于"区域右侧的图片（SVG/PNG）',
    accept: 'image/*',
    type:   'image',
    storagePath: (f) => `site/about-image.${f.name.split('.').pop() || 'png'}`,
  },
];

function SiteConfigManager() {
  const [config, setConfig] = useState({});
  const [status, setStatus] = useState({}); // { [key]: 'idle'|'uploading'|'done'|'error' }

  useEffect(() => {
    loadSiteConfig().then(setConfig).catch(console.error);
  }, []);

  async function handleFileChange(asset, file) {
    if (!file) return;
    setStatus((s) => ({ ...s, [asset.key]: 'uploading' }));
    try {
      const url = await setSiteConfig(asset.key, file, asset.storagePath(file));
      setConfig((c) => ({ ...c, [asset.key]: url }));
      setStatus((s) => ({ ...s, [asset.key]: 'done' }));
      setTimeout(() => setStatus((s) => ({ ...s, [asset.key]: 'idle' })), 2500);
    } catch (err) {
      console.error(err);
      setStatus((s) => ({ ...s, [asset.key]: 'error' }));
    }
  }

  return (
    <div className="admin-content admin-content--single">
      <div className="site-config-list">
        {SITE_ASSETS.map((asset) => {
          const currentUrl = config[asset.key];
          const st = status[asset.key] || 'idle';
          return (
            <div key={asset.key} className="site-config-item">
              <div className="site-config-info">
                <strong>{asset.label}</strong>
                <span className="site-config-desc">{asset.desc}</span>
                {currentUrl && (
                  <a href={currentUrl} target="_blank" rel="noreferrer" className="site-config-url">
                    {currentUrl.split('/').pop()}
                  </a>
                )}
              </div>

              {/* Preview */}
              {currentUrl && asset.type === 'image' && (
                <img src={currentUrl} alt={asset.label} className="site-config-preview-img" />
              )}
              {currentUrl && asset.type === 'video' && (
                <video src={currentUrl} className="site-config-preview-video" muted playsInline controls />
              )}

              <label className={`site-config-upload-btn${st === 'uploading' ? ' uploading' : ''}`}>
                {st === 'uploading' ? '上传中...' : st === 'done' ? '✅ 已保存' : st === 'error' ? '❌ 失败' : currentUrl ? '替换文件' : '上传文件'}
                <input
                  type="file"
                  accept={asset.accept}
                  style={{ display: 'none' }}
                  disabled={st === 'uploading'}
                  onChange={(e) => handleFileChange(asset, e.target.files[0])}
                />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminSkins() {
  const [activeTab, setActiveTab] = useState('skins'); // 'skins' | 'achievements' | 'memes' | 'site'

  // Skins state
  const [skins, setSkins] = useState([]);
  const [selectedSkinId, setSelectedSkinId] = useState(null);
  const [skinsLoading, setSkinsLoading] = useState(true);

  // Achievements state
  const [achievements, setAchievements] = useState([]);
  const [selectedAchId, setSelectedAchId] = useState(null);
  const [achLoading, setAchLoading] = useState(true);

  // Memes state: { [stateKey]: { state, imageDataUrl, caption } }
  const [memes, setMemes] = useState({});
  const [memeSaveStatus, setMemeSaveStatus] = useState({}); // { [stateKey]: 'idle'|'saving'|'saved' }

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
      const data = await loadAllAchievementsFromCloud();
      setAchievements(data);
    } catch (err) {
      console.error('加载成就失败:', err);
    } finally {
      setAchLoading(false);
    }
  }, []);

  const refreshMemes = useCallback(async () => {
    try {
      const map = await loadAllMemesFromCloud();
      setMemes(map);
    } catch (err) {
      console.error('加载梗图失败:', err);
    }
  }, []);

  useEffect(() => {
    refreshSkins();
    refreshAchievements();
    refreshMemes();
  }, [refreshSkins, refreshAchievements, refreshMemes]);

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
    const saved = await saveAchievementToCloud(form);
    setAchievements((prev) => {
      const idx = prev.findIndex((a) => a.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  };

  const handleDeleteAchievement = async (id) => {
    await deleteAchievementFromCloud(id);
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
        <button
          className={`admin-tab${activeTab === 'memes' ? ' active' : ''}`}
          onClick={() => setActiveTab('memes')}
        >
          😂 状态梗图
        </button>
        <button
          className={`admin-tab${activeTab === 'site' ? ' active' : ''}`}
          onClick={() => setActiveTab('site')}
        >
          🎬 站点素材
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

      {/* ── Memes Tab ─────────────────────────────────────────────────────────── */}
      {activeTab === 'memes' && (
        <MemeManager
          memes={memes}
          saveStatus={memeSaveStatus}
          onSave={async (stateKey, file, caption) => {
            setMemeSaveStatus((s) => ({ ...s, [stateKey]: 'saving' }));
            try {
              let saved;
              if (file) {
                // New image uploaded — upload to Supabase Storage
                saved = await saveMemeToCloud(stateKey, file, caption);
              } else {
                // Caption-only update (no new image)
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
          }}
          onDelete={async (stateKey) => {
            await deleteMemeFromCloud(stateKey);
            setMemes((prev) => { const next = { ...prev }; delete next[stateKey]; return next; });
          }}
        />
      )}

      {/* ── Site Assets Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'site' && <SiteConfigManager />}

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
