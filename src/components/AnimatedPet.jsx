import { useState, useEffect, useRef, useCallback } from 'react';
import { STATES } from '../hooks/useGateway';
import './AnimatedPet.css';

function getDesiredState(status, isHappy, frames) {
  switch (status) {
    case STATES.IDLE:
      if (isHappy && frames.happy?.length) return 'happy';
      return 'idle';
    case STATES.THINKING:
      return 'thinking';
    case STATES.TOOL_CALL:
      return 'tool_call';
    case STATES.DONE:
      return 'done';
    case STATES.ERROR:
      return 'error';
    case STATES.OFFLINE:
      return 'offline';
    case STATES.TOKEN_EXHAUSTED:
      return 'error';
    default:
      return 'idle';
  }
}

function resolveDisplayState(desiredState, isReacting, frames) {
  if (isReacting && frames.react?.length) {
    return 'react';
  }

  if (frames[desiredState]?.length) {
    return desiredState;
  }

  if (frames.idle?.length) {
    return 'idle';
  }

  return null; // no frames at all → placeholder
}

export default function AnimatedPet({ skin, status, isHappy, onClick }) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isReacting, setIsReacting] = useState(false);

  const frames = skin?.frames ?? {};
  const frameDuration = skin?.frame_duration_ms ?? 200;
  const isPixelated =
    skin?.art_style === '8-bit' || skin?.pixelated === true;

  const desiredState = getDesiredState(status, isHappy, frames);
  const displayState = resolveDisplayState(desiredState, isReacting, frames);
  const currentFrames = displayState ? (frames[displayState] ?? []) : [];

  const reactTimerRef = useRef(null);
  const prevDisplayState = useRef(displayState);

  // Reset frame index when display state changes
  useEffect(() => {
    if (prevDisplayState.current !== displayState) {
      setCurrentFrame(0);
      prevDisplayState.current = displayState;
    }
  }, [displayState]);

  // Frame cycling interval
  useEffect(() => {
    if (currentFrames.length <= 1) return;

    const id = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % currentFrames.length);
    }, frameDuration);

    return () => clearInterval(id);
  }, [currentFrames, frameDuration]);

  const handleClick = useCallback(() => {
    if (onClick) onClick();

    const reactFrames = frames.react;
    if (!reactFrames?.length) return;

    // Clear any existing react timer
    if (reactTimerRef.current) {
      clearTimeout(reactTimerRef.current);
    }

    setIsReacting(true);
    setCurrentFrame(0);

    const duration = reactFrames.length * frameDuration * 1.2;
    reactTimerRef.current = setTimeout(() => {
      setIsReacting(false);
      reactTimerRef.current = null;
    }, duration);
  }, [frames.react, frameDuration, onClick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reactTimerRef.current) {
        clearTimeout(reactTimerRef.current);
      }
    };
  }, []);

  const currentSrc = currentFrames[currentFrame] ?? null;

  return (
    <div
      className={`animated-pet animated-pet--${displayState ?? 'idle'}${isPixelated ? ' animated-pet--pixelated' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
      }}
    >
      {currentSrc ? (
        <img
          src={currentSrc}
          alt={skin?.name ?? 'pet'}
          className="animated-pet-frame"
          draggable={false}
        />
      ) : (
        <div className="animated-pet-placeholder">🐾</div>
      )}
    </div>
  );
}
