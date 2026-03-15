import { useState } from 'react';
import { generateBadgeSVG, getBadgeMarkdown, downloadBadge } from '../utils/badge';
import './BadgePanel.css';

export default function BadgePanel({ username, status, totalTasks }) {
  const [copied, setCopied] = useState(false);

  if (!username) {
    return (
      <div className="badge-panel badge-panel--locked">
        <span>🔖</span>
        <p>登录后生成 GitHub README Badge</p>
      </div>
    );
  }

  const svg = generateBadgeSVG(username, status, totalTasks);
  const markdown = getBadgeMarkdown(username);
  const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  const copy = async () => {
    await navigator.clipboard?.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="badge-panel">
      <div className="badge-header">
        <span className="badge-title">GitHub README Badge</span>
      </div>
      <div className="badge-preview">
        <img src={dataUrl} alt="badge preview" className="badge-img" />
      </div>
      <div className="badge-actions">
        <button className="badge-btn copy" onClick={copy}>
          {copied ? '✔ 已复制' : '📋 复制 Markdown'}
        </button>
        <button className="badge-btn download" onClick={() => downloadBadge(username, status, totalTasks)}>
          ⬇ 下载 SVG
        </button>
      </div>
      <code className="badge-code">{markdown}</code>
    </div>
  );
}
