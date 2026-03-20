import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';
import ShareCard from './ShareCard';
import './ShareButton.css';

export default function ShareButton({ stats, status, skinId, petFrameUrl, onGenerated }) {
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState('4x5');
  const [preview, setPreview] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const node = document.getElementById('share-card-content');
      if (!node) throw new Error('Card node not found');

      const dataUrl = await toPng(node, {
        width: 400,
        height: 600,
        pixelRatio: 2,
      });

      setPreview(dataUrl);
      onGenerated?.();
    } catch (e) {
      console.error('Card generation failed', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = preview;
    a.download = `openpat-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="share-wrap">
      {preview ? (
        <div className="preview-modal">
          <img src={preview} className="preview-img" alt="share card preview" />
          <div className="preview-actions">
            <button className="btn-download" onClick={handleDownload}>⬇ 保存图片</button>
            <button className="btn-close" onClick={() => setPreview(null)}>重新生成</button>
          </div>
        </div>
      ) : (
        <div className="share-controls">
          <div className="format-toggle">
            <button
              className={format === '4x5' ? 'active' : ''}
              onClick={() => setFormat('4x5')}
            >4:5</button>
            <button
              className={format === '1x1' ? 'active' : ''}
              onClick={() => setFormat('1x1')}
            >1:1</button>
          </div>
          <button
            className="share-btn"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? '生成中...' : '📸 生成炫耀卡片'}
          </button>
        </div>
      )}

      {/* Hidden high-fidelity card for capture — rendered via portal to avoid
          backdrop-filter containing-block interference */}
      {createPortal(
        <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none', zIndex: -1 }}>
          <ShareCard
            stats={stats}
            status={status}
            skin={skinId || 'default'}
            rank={stats.totalTasks >= 50 ? 'gold' : stats.totalTasks >= 10 ? 'cyber' : 'bronze'}
            username="User"
            petFrameUrl={petFrameUrl}
          />
        </div>,
        document.body
      )}
    </div>
  );
}
