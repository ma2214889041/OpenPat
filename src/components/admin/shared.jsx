/**
 * Shared admin UI atoms: RarityBadge, ToggleSwitch, toObjectURL.
 */

export function toObjectURL(blobOrFile) {
  if (!blobOrFile) return null;
  if (typeof blobOrFile === 'string') return blobOrFile;
  return URL.createObjectURL(blobOrFile);
}

export function RarityBadge({ rarity }) {
  return <span className={`rarity-badge rarity-${rarity}`}>{rarity}</span>;
}

export function ToggleSwitch({ checked, onChange, label }) {
  return (
    <label className="toggle-switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track">
        <span className="toggle-thumb" />
      </span>
      {label && <span className="toggle-label">{label}</span>}
    </label>
  );
}

export const RARITY_OPTIONS = ['common', 'rare', 'epic', 'legendary'];
