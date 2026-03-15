import { useState } from 'react';
import { SKINS } from '../hooks/useSkins';
import { startCheckout } from '../utils/checkout';
import './Shop.css';

const STRIPE_PRICES = {
  cyber:    import.meta.env.VITE_STRIPE_CYBER_PRICE,
  pixel:    import.meta.env.VITE_STRIPE_PIXEL_PRICE,
  golden:   import.meta.env.VITE_STRIPE_GOLDEN_PRICE,
  space:    import.meta.env.VITE_STRIPE_SPACE_PRICE,
  guochao:  import.meta.env.VITE_STRIPE_GUOCHAO_PRICE,
};

export default function Shop({ ownedIds, onUnlock }) {
  const [buying, setBuying] = useState(null);

  const handleBuy = async (skin) => {
    const priceId = STRIPE_PRICES[skin.id];
    setBuying(skin.id);
    await startCheckout(skin.id, priceId, (id) => {
      onUnlock(id);
      setTimeout(() => setBuying(null), 2000);
    });
    if (!priceId) return; // demo unlock handled by callback
    setBuying(null);
  };

  const paid = SKINS.filter(s => s.price > 0);
  const bundle = paid.length * 4.99;

  return (
    <div className="shop-page">
      <div className="shop-header">
        <h1>🛒 皮肤商店</h1>
        <p>买断制，一次购买永久拥有。所有皮肤不影响功能，只是让龙虾更好看。</p>
      </div>

      {/* Bundle */}
      <div className="bundle-card">
        <div className="bundle-left">
          <div className="bundle-title">🎁 终身赞助者包</div>
          <div className="bundle-desc">包含全部现有 + 未来皮肤，专属赞助者徽章</div>
          <div className="bundle-skins">
            {paid.map(s => <span key={s.id}>{s.emoji}</span>)}
            <span style={{opacity:0.5}}>+ 未来皮肤</span>
          </div>
        </div>
        <div className="bundle-right">
          <div className="bundle-price">
            <span className="bundle-original">${bundle.toFixed(2)}</span>
            <span className="bundle-final">$9.99</span>
          </div>
          <button
            className="buy-btn bundle-btn"
            onClick={async () => {
              const bundlePriceId = import.meta.env.VITE_STRIPE_BUNDLE_PRICE;
              await startCheckout('bundle', bundlePriceId, () => {
                paid.forEach(s => onUnlock(s.id));
              });
            }}
          >
            立即购买
          </button>
        </div>
      </div>

      {/* Individual skins */}
      <div className="skins-grid">
        {SKINS.map(skin => {
          const owned = ownedIds.includes(skin.id);
          const justBought = buying === skin.id;
          return (
            <div key={skin.id} className={`skin-card ${owned ? 'owned' : ''}`}>
              <div
                className="skin-preview"
                style={{ filter: skin.colors.filter !== 'none' ? skin.colors.filter : undefined }}
              >
                <span className="skin-big-emoji">🦞</span>
                {skin.pixelated && <div className="pixel-overlay" />}
              </div>
              <div className="skin-card-body">
                <div className="skin-card-header">
                  <span className="skin-card-emoji">{skin.emoji}</span>
                  <span className="skin-card-name">{skin.name}</span>
                  {skin.price === 0 && <span className="skin-badge free">免费</span>}
                </div>
                <p className="skin-card-desc">{skin.description}</p>
                {owned ? (
                  <div className="owned-badge">✔ 已拥有</div>
                ) : justBought ? (
                  <div className="owned-badge just-bought">🎉 解锁成功！</div>
                ) : (
                  <button className="buy-btn" onClick={() => handleBuy(skin)}>
                    ${skin.price.toFixed(2)} 购买
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="shop-footer">
        <p>💳 支持 Stripe · 支付宝 · 微信支付（即将支持）</p>
        <p>所有数据保存在本地，退款请联系 <code>hi@lobster.pet</code></p>
      </div>
    </div>
  );
}
