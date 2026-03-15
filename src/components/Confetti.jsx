import { useEffect, useRef } from 'react';
import './Confetti.css';

const COLORS = ['#e8401c', '#fb923c', '#22c55e', '#3b82f6', '#a78bfa', '#f59e0b', '#f1f5f9'];

function randomBetween(a, b) { return a + Math.random() * (b - a); }

function createParticle(container) {
  const el = document.createElement('div');
  el.className = 'confetti-particle';
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const shape = Math.random() > 0.5 ? '50%' : '0';
  const size = randomBetween(6, 12);
  el.style.cssText = `
    left: ${randomBetween(10, 90)}%;
    background: ${color};
    width: ${size}px;
    height: ${size * (Math.random() > 0.5 ? 1 : 0.5)}px;
    border-radius: ${shape};
    animation-duration: ${randomBetween(1.2, 2.2)}s;
    animation-delay: ${randomBetween(0, 0.6)}s;
    transform: rotate(${randomBetween(0, 360)}deg);
  `;
  container.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

export function triggerConfetti(count = 60) {
  let container = document.getElementById('confetti-root');
  if (!container) {
    container = document.createElement('div');
    container.id = 'confetti-root';
    container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
    document.body.appendChild(container);
  }
  for (let i = 0; i < count; i++) createParticle(container);
}

// React component wrapper — call triggerConfetti() imperatively instead where possible
export default function Confetti({ active }) {
  useEffect(() => {
    if (active) triggerConfetti();
  }, [active]);
  return null;
}
