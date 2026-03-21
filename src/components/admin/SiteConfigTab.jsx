import { useState, useEffect } from 'react';
import { loadSiteConfig, setSiteConfig } from '../../utils/supabaseStorage';

const SITE_ASSETS = [
  { key: 'hero_video_url', label: '首屏背景视频', desc: '首页 hero 区域的背景视频（mp4）', accept: 'video/mp4,video/*', type: 'video', storagePath: (f) => `site/hero.${f.name.split('.').pop() || 'mp4'}` },
  { key: 'about_image_url', label: '关于我们插图', desc: '首页"关于"区域右侧的图片（SVG/PNG）', accept: 'image/*', type: 'image', storagePath: (f) => `site/about-image.${f.name.split('.').pop() || 'png'}` },
];

export default function SiteConfigTab() {
  const [config, setConfig] = useState({});
  const [status, setStatus] = useState({});

  useEffect(() => { loadSiteConfig().then(setConfig).catch(console.error); }, []);

  async function handleFileChange(asset, file) {
    if (!file) return;
    setStatus((s) => ({ ...s, [asset.key]: 'uploading' }));
    try {
      const url = await setSiteConfig(asset.key, file, asset.storagePath(file));
      setConfig((c) => ({ ...c, [asset.key]: url }));
      setStatus((s) => ({ ...s, [asset.key]: 'done' }));
      setTimeout(() => setStatus((s) => ({ ...s, [asset.key]: 'idle' })), 2500);
    } catch (err) {
      console.error(err);
      setStatus((s) => ({ ...s, [asset.key]: 'error' }));
    }
  }

  return (
    <div className="admin-content admin-content--single">
      <div className="site-config-list">
        {SITE_ASSETS.map((asset) => {
          const currentUrl = config[asset.key];
          const st = status[asset.key] || 'idle';
          return (
            <div key={asset.key} className="site-config-item">
              <div className="site-config-info">
                <strong>{asset.label}</strong>
                <span className="site-config-desc">{asset.desc}</span>
                {currentUrl && <a href={currentUrl} target="_blank" rel="noreferrer" className="site-config-url">{currentUrl.split('/').pop()}</a>}
              </div>
              {currentUrl && asset.type === 'image' && <img src={currentUrl} alt={asset.label} className="site-config-preview-img" />}
              {currentUrl && asset.type === 'video' && <video src={currentUrl} className="site-config-preview-video" muted playsInline controls />}
              <label className={`site-config-upload-btn${st === 'uploading' ? ' uploading' : ''}`}>
                {st === 'uploading' ? '上传中...' : st === 'done' ? '✅ 已保存' : st === 'error' ? '❌ 失败' : currentUrl ? '替换文件' : '上传文件'}
                <input type="file" accept={asset.accept} style={{ display: 'none' }} disabled={st === 'uploading'} onChange={(e) => handleFileChange(asset, e.target.files[0])} />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
