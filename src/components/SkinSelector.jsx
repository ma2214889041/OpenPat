import './SkinSelector.css';
import { SKINS } from '../hooks/useSkins';

export default function SkinSelector({ activeSkinId, ownedIds, onSelect, onShop }) {
  const owned = SKINS.filter(s => ownedIds.includes(s.id));

  return (
    <div className="skin-selector">
      <div className="skin-selector-header">
        <span className="skin-label">外观</span>
        <button className="skin-shop-link" onClick={onShop}>🛒 皮肤商店</button>
      </div>
      <div className="skin-list">
        {owned.map(skin => (
          <button
            key={skin.id}
            className={`skin-item ${activeSkinId === skin.id ? 'active' : ''}`}
            onClick={() => onSelect(skin.id)}
            title={skin.name}
          >
            <span className="skin-emoji">{skin.emoji}</span>
            <span className="skin-name">{skin.name}</span>
          </button>
        ))}
        {SKINS.filter(s => !ownedIds.includes(s.id)).map(skin => (
          <button
            key={skin.id}
            className="skin-item locked"
            onClick={onShop}
            title={`${skin.name} — 前往商店解锁`}
          >
            <span className="skin-emoji">🔒</span>
            <span className="skin-name">{skin.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
