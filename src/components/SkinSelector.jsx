import './SkinSelector.css';
import { SKINS } from '../hooks/useSkins';

export default function SkinSelector({ activeSkinId, onSelect }) {
  return (
    <div className="skin-selector">
      <div className="skin-selector-header">
        <span className="skin-label">✨ 外观</span>
        <span className="skin-free-hint">全部免费</span>
      </div>
      <div className="skin-list">
        {SKINS.map(skin => (
          <button
            key={skin.id}
            className={`skin-item ${activeSkinId === skin.id ? 'active' : ''}`}
            onClick={() => onSelect(skin.id)}
            title={skin.description}
          >
            <span className="skin-emoji">{skin.emoji}</span>
            <span className="skin-name">{skin.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
