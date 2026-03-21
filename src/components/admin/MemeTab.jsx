import { useState, useEffect, useRef } from 'react';
import { hasSupabase } from '../../utils/supabase';

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

export default function MemeTab({ memes, saveStatus, onSave, onDelete }) {
  const fileRefs = useRef({});
  const [drafts, setDrafts] = useState(() => {
    const d = {};
    MEME_STATES.forEach(({ key }) => { d[key] = { file: null, caption: '', previewUrl: null }; });
    return d;
  });

  useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      MEME_STATES.forEach(({ key }) => {
        if (memes[key]) {
          next[key] = { file: null, caption: memes[key].caption ?? '', previewUrl: memes[key].image_url ?? null };
        }
      });
      return next;
    });
  }, [memes]);

  const handleFileChange = (stateKey, file) => {
    if (!file) return;
    setDrafts((prev) => ({ ...prev, [stateKey]: { ...prev[stateKey], file, previewUrl: URL.createObjectURL(file) } }));
  };

  const handleCaption = (stateKey, val) => {
    setDrafts((prev) => ({ ...prev, [stateKey]: { ...prev[stateKey], caption: val } }));
  };

  const canSave = (stateKey) => {
    const draft = drafts[stateKey];
    return draft.file !== null || (memes[stateKey] && draft.caption !== (memes[stateKey].caption ?? ''));
  };

  return (
    <div className="meme-manager">
      {!hasSupabase && (
        <div className="meme-manager-hint" style={{ borderColor: '#f97316', color: '#f97316' }}>
          ⚠️ 未配置 Supabase，梗图无法保存到云端。
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
              <div
                className={`meme-image-area${draft.previewUrl ? ' has-image' : ''}`}
                onClick={() => fileRefs.current[key]?.click()} role="button" tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileRefs.current[key]?.click(); }}
              >
                <input ref={(el) => { fileRefs.current[key] = el; }} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={(e) => { handleFileChange(key, e.target.files?.[0]); e.target.value = ''; }} />
                {draft.previewUrl
                  ? <img src={draft.previewUrl} alt={label} className="meme-preview-img" />
                  : <div className="meme-upload-placeholder"><span style={{ fontSize: 32 }}>🖼️</span><span>点击上传梗图</span></div>}
              </div>
              <textarea className="meme-caption-input" value={draft.caption} onChange={(e) => handleCaption(key, e.target.value)}
                placeholder="配套文案，比如：它在思考，就像你不会的那些事" rows={2} />
              <div className="meme-card-actions">
                <button className="btn-save" disabled={status === 'saving' || !canSave(key) || !hasSupabase} onClick={() => onSave(key, draft.file, draft.caption)}>
                  {status === 'saving' ? '上传中...' : status === 'saved' ? '已保存 ✓' : '保存到云端'}
                </button>
                {isSaved && <button className="btn-delete" onClick={() => onDelete(key)}>删除</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
