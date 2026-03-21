import { useState, useEffect, useRef, useCallback } from 'react';
import { prepareSkinForDisplay } from '../../utils/skinStorage';
import AnimatedPet from '../AnimatedPet';
import { STATES } from '../../utils/states';
import { RarityBadge, ToggleSwitch, toObjectURL, RARITY_OPTIONS } from './shared';

const FRAME_STATES = ['idle', 'happy', 'thinking', 'tool_call', 'done', 'error', 'offline', 'react'];

const STATE_PREVIEW_MAP = {
  idle: STATES.IDLE, happy: STATES.IDLE, thinking: STATES.THINKING,
  tool_call: STATES.TOOL_CALL, done: STATES.DONE, error: STATES.ERROR,
  offline: STATES.OFFLINE, react: STATES.IDLE,
};

export function emptyFrames() {
  return Object.fromEntries(FRAME_STATES.map((s) => [s, []]));
}

export function newSkin() {
  return {
    id: crypto.randomUUID(), name: '新皮肤', emoji: '🦞', art_style: '',
    rarity: 'common', description: '', is_active: false, unlock_achievement: null,
    frame_duration_ms: 200, frames: emptyFrames(),
  };
}

// ── SkinListItem ─────────────────────────────────────────────────────────────

function SkinListItem({ skin, selected, onClick }) {
  return (
    <div
      className={`admin-list-item${selected ? ' selected' : ''}`}
      onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
    >
      <span className="list-item-emoji">{skin.emoji || '🦞'}</span>
      <span className="list-item-name">{skin.name}</span>
      <RarityBadge rarity={skin.rarity} />
      <span className={`active-dot ${skin.is_active ? 'active' : 'inactive'}`} title={skin.is_active ? '已启用' : '未启用'} />
    </div>
  );
}

// ── FrameUploader ────────────────────────────────────────────────────────────

function FrameUploader({ stateKey, frames, onAdd, onRemove }) {
  const inputRef = useRef(null);
  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    onAdd(stateKey, files);
    e.target.value = '';
  };
  return (
    <div className="frame-uploader">
      <div className="frame-uploader-header">
        <span className="frame-count-badge">{frames.length} 帧</span>
        <button type="button" className="btn-upload-frames" onClick={() => inputRef.current?.click()}>+ 上传帧</button>
        <input ref={inputRef} type="file" accept="image/png,image/gif,image/webp" multiple style={{ display: 'none' }} onChange={handleFiles} />
      </div>
      {frames.length > 0 && (
        <div className="frames-grid">
          {frames.map((frame, i) => (
            <div key={i} className="frame-thumb">
              <img src={toObjectURL(frame)} alt={`frame ${i}`} draggable={false} />
              <span className="frame-index">{i}</span>
              <button type="button" className="frame-delete" onClick={() => onRemove(stateKey, i)} title="删除此帧">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SkinEditor ───────────────────────────────────────────────────────────────

function SkinEditor({ skin, onSave, onDelete }) {
  const [form, setForm] = useState(skin);
  const [activeFrameState, setActiveFrameState] = useState('idle');
  const [previewState, setPreviewState] = useState('idle');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [previewSkin, setPreviewSkin] = useState(null);

  useEffect(() => { setForm(skin); setActiveFrameState('idle'); setPreviewState('idle'); setSaveStatus('idle'); }, [skin.id]);

  useEffect(() => {
    let cancelled = false;
    prepareSkinForDisplay(form).then((p) => { if (!cancelled) setPreviewSkin(p); }).catch(() => {});
    return () => { cancelled = true; };
  }, [form.frames, form.frame_duration_ms, form.art_style, form.name]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleAddFrames = useCallback((stateKey, files) => {
    setForm((f) => ({ ...f, frames: { ...f.frames, [stateKey]: [...(f.frames[stateKey] || []), ...files] } }));
  }, []);

  const handleRemoveFrame = useCallback((stateKey, index) => {
    setForm((f) => ({ ...f, frames: { ...f.frames, [stateKey]: f.frames[stateKey].filter((_, i) => i !== index) } }));
  }, []);

  const handleSave = async () => {
    setSaveStatus('saving');
    try { await onSave(form); setSaveStatus('saved'); setTimeout(() => setSaveStatus('idle'), 2000); }
    catch (err) { console.error('保存皮肤失败:', err); setSaveStatus('idle'); alert('保存失败: ' + err.message); }
  };

  const handleDelete = () => {
    if (window.confirm(`确认删除皮肤「${form.name}」？此操作不可撤销。`)) onDelete(form.id);
  };

  const previewStatus = STATE_PREVIEW_MAP[previewState] ?? STATES.IDLE;
  const isHappyPreview = previewState === 'happy';

  return (
    <div className="admin-editor">
      <div className="form-section">
        <h3 className="section-title">基本信息</h3>
        <div className="form-row">
          <div className="form-group flex-2">
            <label>皮肤名称</label>
            <input type="text" value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="皮肤名称" />
          </div>
          <div className="form-group flex-1">
            <label>Emoji</label>
            <input type="text" value={form.emoji} onChange={(e) => setField('emoji', e.target.value.slice(0, 2))} placeholder="🦞" maxLength={2} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group flex-2">
            <label>艺术风格</label>
            <input type="text" value={form.art_style} onChange={(e) => setField('art_style', e.target.value)} placeholder="8-bit, tamagotchi, cyberpunk, 水墨..." />
          </div>
          <div className="form-group flex-1">
            <label>稀有度</label>
            <select value={form.rarity} onChange={(e) => setField('rarity', e.target.value)}>
              {RARITY_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>描述</label>
          <textarea value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="皮肤描述..." rows={2} />
        </div>
        <div className="form-row">
          <div className="form-group flex-2">
            <label>解锁成就 ID <span className="label-hint">（留空表示默认解锁）</span></label>
            <input type="text" value={form.unlock_achievement || ''} onChange={(e) => setField('unlock_achievement', e.target.value || null)} placeholder="输入成就ID或留空" />
          </div>
          <div className="form-group flex-1">
            <label>帧间隔 ms</label>
            <input type="number" value={form.frame_duration_ms} onChange={(e) => setField('frame_duration_ms', Math.max(50, Math.min(1000, Number(e.target.value))))} min={50} max={1000} step={50} />
          </div>
        </div>
        <div className="form-row align-center">
          <ToggleSwitch checked={form.is_active} onChange={(v) => setField('is_active', v)} label="已启用" />
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-title">帧图片管理</h3>
        <div className="state-tabs">
          {FRAME_STATES.map((s) => (
            <button key={s} type="button" className={`state-tab${activeFrameState === s ? ' active' : ''}`} onClick={() => setActiveFrameState(s)}>
              {s}{form.frames[s]?.length > 0 && <span className="state-tab-count">{form.frames[s].length}</span>}
            </button>
          ))}
        </div>
        <FrameUploader stateKey={activeFrameState} frames={form.frames[activeFrameState] || []} onAdd={handleAddFrames} onRemove={handleRemoveFrame} />
      </div>

      <div className="form-section">
        <h3 className="section-title">预览</h3>
        <div className="preview-area">
          <div className="preview-pet-wrap">
            {previewSkin ? <AnimatedPet skin={previewSkin} status={previewStatus} isHappy={isHappyPreview} /> : <div className="preview-placeholder">🦞</div>}
          </div>
          <div className="preview-state-buttons">
            {FRAME_STATES.map((s) => (
              <button key={s} type="button" className={`state-tab${previewState === s ? ' active' : ''}`} onClick={() => setPreviewState(s)}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="editor-actions">
        <button type="button" className="btn-save" onClick={handleSave} disabled={saveStatus === 'saving'}>
          {saveStatus === 'saving' ? '保存中...' : saveStatus === 'saved' ? '已保存 ✓' : '保存'}
        </button>
        <button type="button" className="btn-delete" onClick={handleDelete}>删除</button>
      </div>
    </div>
  );
}

// ── SkinTab (list + editor layout) ──────────────────────────────────────────

export default function SkinTab({ skins, selectedId, onSelect, onNew, onSave, onDelete, loading }) {
  const selected = skins.find((s) => s.id === selectedId) ?? null;
  return (
    <div className="admin-content">
      <div className="admin-list">
        <button className="btn-new" onClick={onNew}>+ 新建皮肤</button>
        {loading ? <div className="list-loading">加载中...</div>
          : skins.length === 0 ? <div className="list-empty">暂无皮肤</div>
          : skins.map((skin) => (
            <SkinListItem key={skin.id} skin={skin} selected={skin.id === selectedId} onClick={() => onSelect(skin.id)} />
          ))}
      </div>
      <div className="admin-editor-wrap">
        {selected ? (
          <SkinEditor key={selected.id} skin={selected} onSave={onSave} onDelete={onDelete} />
        ) : (
          <div className="admin-empty-state"><span className="empty-icon">🎨</span><p>选择或创建皮肤</p></div>
        )}
      </div>
    </div>
  );
}
