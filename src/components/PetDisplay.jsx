import AnimatedPet from './AnimatedPet';

/**
 * Unified pet renderer.
 * Shows animated skin (PNG frames from IndexedDB) when available,
 * otherwise shows a placeholder waiting for sprite upload.
 */
export default function PetDisplay({ animatedSkin, isHappy, status, onClick }) {
  if (animatedSkin) {
    return (
      <AnimatedPet
        skin={animatedSkin}
        status={status}
        isHappy={isHappy}
        onClick={onClick}
      />
    );
  }

  return (
    <div className="pet-placeholder" onClick={onClick}>
      <div className="pet-placeholder-inner">
        <span className="pet-placeholder-icon">🦞</span>
        <span className="pet-placeholder-text">皮肤未加载</span>
      </div>
    </div>
  );
}
