import AnimatedPet from './AnimatedPet';
import PetSVG from './PetSVG';

/**
 * Unified pet renderer.
 * Shows animated skin (PNG frames from IndexedDB) when available,
 * otherwise shows SVG pet with idle activity animations.
 */
export default function PetDisplay({ animatedSkin, isHappy, status, onClick, idleActivity }) {
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
    <PetSVG
      status={status}
      onClick={onClick}
      idleActivity={idleActivity}
    />
  );
}
