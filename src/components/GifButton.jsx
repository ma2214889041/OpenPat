import { useState } from 'react';
import { generateGifCard } from '../utils/gifCard';
import './GifButton.css';

export default function GifButton({ stats, skinColors, petFrameUrls }) {
  const [state, setState] = useState('idle'); // idle | loading | done | error
  const [gifUrl, setGifUrl] = useState(null);

  const generate = async () => {
    setState('loading');
    try {
      const blob = await generateGifCard(stats, skinColors, petFrameUrls);
      const url = URL.createObjectURL(blob);
      setGifUrl(url);
      setState('done');
    } catch (e) {
      console.error('GIF failed', e);
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  };

  const download = () => {
    const a = document.createElement('a');
    a.href = gifUrl;
    a.download = `openpat-${Date.now()}.gif`;
    a.click();
  };

  if (state === 'done' && gifUrl) {
    return (
      <div className="gif-preview-modal">
        <img src={gifUrl} className="gif-preview-img" alt="animated lobster gif" />
        <div className="gif-actions">
          <button className="gif-dl-btn" onClick={download}>⬇ 保存 GIF</button>
          <button className="gif-reset-btn" onClick={() => { setState('idle'); setGifUrl(null); }}>重新生成</button>
        </div>
      </div>
    );
  }

  return (
    <button
      className="gif-btn"
      onClick={generate}
      disabled={state === 'loading'}
    >
      {state === 'loading' ? (
        <><span className="gif-spinner">⏳</span> 生成 GIF 中...</>
      ) : state === 'error' ? (
        '❌ 生成失败'
      ) : (
        '✨ 生成动态 GIF'
      )}
    </button>
  );
}
