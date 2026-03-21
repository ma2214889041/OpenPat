import { useState, useEffect, useRef } from 'react';
import { RarityBadge, ToggleSwitch, toObjectURL, RARITY_OPTIONS } from './shared';

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

export function newAchievement() {
  return {
    id: crypto.randomUUID(), name: '新成就', desc: '', rarity: 'common', emoji: '🏆',
    icon_locked: null, icon_unlocked: null, unlock_type: 'first_connect', unlock_threshold: null,
    unlock_caption: '', share_caption: '', is_active: true,
  };
}

function IconUploadArea({ label, value, onChange, dim }) {
  const inputRef = useRef(null);
  const previewSrc = value ? toObjectURL(value) : null;
  return (
    <div className={`icon-upload-area${dim ? ' icon-dim' : ''}`} onClick={() => inputRef.current?.click()}
      role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }} title={label}>
      <input ref={inputRef} type="file" accept="image/png,image/gif,image/webp" style={{ display: 'none' }}
        onChange={(e) => { const file = e.target.files?.[0]; if (file) onChange(file); e.target.value = ''; }} />
      {previewSrc ? <img src={previewSrc} alt={label} className="icon-preview-img" /> : <span className="icon-upload-placeholder">+</span>}
      <span className="icon-upload-label">{label}</span>
    </div>
  );
}

function AchievementListItem({ ach, selected, onClick }) {
  return (
    <div className={`admin-list-item${selected ? ' selected' : ''}`} onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}>
      <span className="list-item-emoji">{ach.emoji || '🏆'}</span>
      <span className="list-item-name">{ach.name}</span>
      <RarityBadge rarity={ach.rarity} />
    </div>
  );
}

function AchievementEditor({ ach, onSave, onDelete }) {
  const [form, setForm] = useState(ach);
  const [saveStatus, setSaveStatus] = useState('idle');

  useEffect(() => { setForm(ach); setSaveStatus('idle'); }, [ach.id]);
  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const selectedType = UNLOCK_TYPES.find((t) => t.value === form.unlock_type);
  const needsThreshold = selectedType?.needsThreshold ?? false;

  const handleSave = async () => {
    setSaveStatus('saving');
    try { await onSave(form); setSaveStatus('saved'); setTimeout(() => setSaveStatus('idle'), 2000); }
    catch (err) { console.error('保存成就失败:', err); setSaveStatus('idle'); alert('保存失败: ' + err.message); }
  };
  const handleDelete = () => {
    if (window.confirm(`确认删除成就「${form.name}」？此操作不可撤销。`)) onDelete(form.id);
  };

  return (
    <div className="admin-editor">
      <div className="form-section">
        <h3 className="section-title">成就信息</h3>
        <div className="form-row">
          <div className="form-group flex-2">
            <label>成就名称</label>
            <input type="text" value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="成就名称" />
          </div>
          <div className="form-group flex-1">
            <label>Emoji</label>
            <input type="text" value={form.emoji} onChange={(e) => setField('emoji', e.target.value.slice(0, 2))} placeholder="🏆" maxLength={2} />
          </div>
        </div>
        <div className="form-group">
          <label>描述</label>
          <textarea value={form.desc} onChange={(e) => setField('desc', e.target.value)} placeholder="成就描述..." rows={2} />
        </div>
        <div className="form-row">
          <div className="form-group flex-1">
            <label>稀有度</label>
            <select value={form.rarity} onChange={(e) => setField('rarity', e.target.value)}>
              {RARITY_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-group flex-2">
            <label>解锁条件</label>
            <select value={form.unlock_type} onChange={(e) => {
              const type = e.target.value;
              const ti = UNLOCK_TYPES.find((t) => t.value === type);
              setField('unlock_type', type);
              if (!ti?.needsThreshold) setField('unlock_threshold', null);
            }}>
              {UNLOCK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          {needsThreshold && (
            <div className="form-group flex-1">
              <label>阈值 N</label>
              <input type="number" value={form.unlock_threshold ?? ''} onChange={(e) => setField('unlock_threshold', e.target.value === '' ? null : Number(e.target.value))} placeholder="0" min={0} />
            </div>
          )}
        </div>
        <div className="form-row align-center">
          <ToggleSwitch checked={form.is_active} onChange={(v) => setField('is_active', v)} label="已启用" />
        </div>
      </div>
      <div className="form-section">
        <h3 className="section-title">搞笑台词</h3>
        <div className="form-group">
          <label>解锁台词 <span className="label-hint">（弹窗里显示的那句话，要搞笑）</span></label>
          <textarea value={form.unlock_caption ?? ''} onChange={(e) => setField('unlock_caption', e.target.value)} placeholder="它睁开了眼睛，看了看世界，然后立刻开始工作..." rows={3} />
        </div>
        <div className="form-group">
          <label>分享文案 <span className="label-hint">（出现在分享卡片里的那句话）</span></label>
          <textarea value={form.share_caption ?? ''} onChange={(e) => setField('share_caption', e.target.value)} placeholder="我的 Agent 今天正式上岗了。它没有问五险一金..." rows={3} />
        </div>
      </div>
      <div className="form-section">
        <h3 className="section-title">图标</h3>
        <div className="icon-upload-grid">
          <IconUploadArea label="锁定图标" value={form.icon_locked} onChange={(file) => setField('icon_locked', file)} dim />
          <IconUploadArea label="解锁图标" value={form.icon_unlocked} onChange={(file) => setField('icon_unlocked', file)} dim={false} />
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

export default function AchievementTab({ achievements, selectedId, onSelect, onNew, onSave, onDelete, loading }) {
  const selected = achievements.find((a) => a.id === selectedId) ?? null;
  return (
    <div className="admin-content">
      <div className="admin-list">
        <button className="btn-new" onClick={onNew}>+ 新建成就</button>
        {loading ? <div className="list-loading">加载中...</div>
          : achievements.length === 0 ? <div className="list-empty">暂无成就</div>
          : achievements.map((ach) => (
            <AchievementListItem key={ach.id} ach={ach} selected={ach.id === selectedId} onClick={() => onSelect(ach.id)} />
          ))}
      </div>
      <div className="admin-editor-wrap">
        {selected ? (
          <AchievementEditor key={selected.id} ach={selected} onSave={onSave} onDelete={onDelete} />
        ) : (
          <div className="admin-empty-state"><span className="empty-icon">🏆</span><p>选择或创建成就</p></div>
        )}
      </div>
    </div>
  );
}
