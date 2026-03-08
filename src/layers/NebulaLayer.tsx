import React, { useRef, useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { useActivePhase } from '../hooks/phase-context';
import { useRenderSeed } from '../hooks/useRenderSeed';

// Cosmic nebula dust — soft particle cloud with noise-driven drift.
// Particles are large radial gradients that overlap to create volumetric feel.

const MAX_PARTICLES = 60;

interface NebulaParticle {
  baseX: number;
  baseY: number;
  size: number;
  speed: number;
  phase: number;
  depth: number; // 0=back, 1=front — affects opacity and color blend
}

function generateParticles(count: number, w: number, h: number, seed: number): NebulaParticle[] {
  // Simple seeded PRNG
  let s = seed | 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const particles: NebulaParticle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      baseX: rand() * w,
      baseY: rand() * h,
      size: 60 + rand() * 200,
      speed: 0.3 + rand() * 1.2,
      phase: rand() * Math.PI * 2,
      depth: rand(),
    });
  }
  return particles;
}

export const NebulaLayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { intensity, beatPulse, audioEnergy, color, accentColor } = useActivePhase();
  const seed = useRenderSeed();

  const particleCount = Math.floor(20 + intensity * 40); // 20-60

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const particles = generateParticles(particleCount, width, height, seed);

    // Parse colors
    const parseHex = (hex: string) => [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
    const [cr, cg, cb] = parseHex(color);
    const [ar, ag, ab] = parseHex(accentColor);

    const time = frame * 0.008;

    // Sort by depth (back first)
    const sorted = [...particles].sort((a, b) => a.depth - b.depth);

    for (const p of sorted) {
      // Noise-like drift using layered sines
      const dx =
        Math.sin(time * p.speed + p.phase) * 40 +
        Math.sin(time * p.speed * 0.6 + p.phase * 2.3) * 25;
      const dy =
        Math.cos(time * p.speed * 0.8 + p.phase * 1.7) * 35 +
        Math.sin(time * p.speed * 0.4 + p.phase * 3.1) * 20;

      const x = p.baseX + dx;
      const y = p.baseY + dy;

      // Size breathes with beat
      const size = p.size * (1 + beatPulse * 0.15 * intensity + audioEnergy * 0.1);

      // Blend between phase color and accent based on depth
      const t = p.depth;
      const r = Math.round(cr + (ar - cr) * t);
      const g = Math.round(cg + (ag - cg) * t);
      const b = Math.round(cb + (ab - cb) * t);

      // Opacity: back particles dimmer, front brighter
      const alpha = (0.02 + p.depth * 0.06) * (0.5 + intensity * 0.5) + audioEnergy * 0.02;

      const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
      grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
      grad.addColorStop(0.5, `rgba(${r},${g},${b},${alpha * 0.4})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }, [frame, width, height, intensity, beatPulse, audioEnergy, color, accentColor, seed, particleCount]);

  return (
    <AbsoluteFill>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width: '100%', height: '100%' }}
      />
    </AbsoluteFill>
  );
};
