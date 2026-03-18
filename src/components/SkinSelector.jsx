import './SkinSelector.css';

const RARITY_SYMBOLS = {
  common: '⚪',
  uncommon: '🟢',
  rare: '🔵',
  epic: '🟣',
  legendary: '🟠'
};

export default function SkinSelector({ activeSkinId, skins = [], onSelect }) {
  return (
    <div className="skin-selector">
      <div className="skin-selector-header">
        <h3 className="skin-selector-title">
          <span className="sparkle">✨</span> 换衣间
        </h3>
        <p className="skin-subtitle">选择你的龙虾形态</p>
      </div>

      {skins.length === 0 && (
        <div className="skin-empty">
          <p>还没有皮肤</p>
          <a href="/admin" className="skin-empty-link">前往管理后台上传皮肤 →</a>
        </div>
      )}

      <div className="skin-grid">
        {skins.map(skin => (
          <button
            key={skin.id}
            className={`skin-item skin-rarity-${skin.rarity || 'common'} ${activeSkinId === skin.id ? 'active' : ''}`}
            onClick={() => onSelect(skin.id)}
            data-rarity={skin.rarity || 'common'}
          >
            <div className="skin-item-glow"></div>
            <div className="skin-item-content">
              <span className="skin-emoji">{skin.emoji}</span>
              <div className="skin-info">
                <span className="skin-name">{skin.name}</span>
                <span className="skin-rarity-badge">
                  {RARITY_SYMBOLS[skin.rarity || 'common']} {skin.rarity || 'Common'}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
