import './KeyboardHints.css';

const SHORTCUTS = [
  { key: 'S', desc: '生成分享卡片' },
  { key: 'H', desc: '查看历史会话' },
  { key: 'C', desc: '复制状态摘要' },
  { key: 'M', desc: '切换模型显示' },
  { key: 'N', desc: '开启浏览器通知' },
  { key: '?', desc: '显示/隐藏快捷键' },
];

export default function KeyboardHints({ visible, onClose }) {
  if (!visible) return null;
  return (
    <div className="kb-overlay" onClick={onClose}>
      <div className="kb-modal" onClick={e => e.stopPropagation()}>
        <div className="kb-header">
          <span>⌨️ 键盘快捷键</span>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="kb-list">
          {SHORTCUTS.map(s => (
            <div key={s.key} className="kb-row">
              <kbd className="kb-key">{s.key}</kbd>
              <span className="kb-desc">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
