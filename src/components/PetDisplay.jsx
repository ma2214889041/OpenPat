import AnimatedPet from './AnimatedPet';
import LobsterSVG from './LobsterSVG';
import ImagePet from './ImagePet';

/**
 * Unified pet renderer.
 *
 * Priority:
 *   1. animatedSkin (PNG frames from IndexedDB) → AnimatedPet
 *   2. skin.display_type === 'image'            → ImagePet
 *   3. default                                  → LobsterSVG
 */
export default function PetDisplay({
  // SVG / legacy skin
  skin,
  rank,
  fatness,
  // Animated skin (takes priority when provided)
  animatedSkin,
  isHappy,
  // Shared
  status,
  onClick,
}) {
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

  if (skin?.display_type === 'image') {
    return (
      <ImagePet
        status={status}
        assets={skin.assets}
        name={skin.name}
        onClick={onClick}
      />
    );
  }

  return (
    <LobsterSVG
      status={status}
      onClick={onClick}
      fatness={fatness}
      skin={skin?.id ?? 'default'}
      rank={rank}
    />
  );
}
