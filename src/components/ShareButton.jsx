import { useState } from 'react';
import { generateShareCard } from '../utils/shareCard';
import './ShareButton.css';

export default function ShareButton({ stats, status, skinColors }) {
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState('1x1');
  const [preview, setPreview] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const url = await generateShareCard(stats, status, format, skinColors);
      setPreview(url);
    } catch (e) {
      console.error('Card generation failed', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = preview;
    a.download = `lobster-pet-${Date.now()}.png`;
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
              className={format === '1x1' ? 'active' : ''}
              onClick={() => setFormat('1x1')}
            >1:1</button>
            <button
              className={format === '9x16' ? 'active' : ''}
              onClick={() => setFormat('9x16')}
            >9:16</button>
          </div>
          <button
            className="share-btn"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? '生成中...' : '🎉 生成分享卡片'}
          </button>
        </div>
      )}
    </div>
  );
}
