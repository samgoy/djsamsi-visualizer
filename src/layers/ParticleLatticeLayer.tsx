import React, { useRef, useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { useActivePhase } from '../hooks/phase-context';
import { generateParticleGrid, findConnections } from '../utils/particles';
import { DJSAMSI } from '../brand';
import { lerpColor } from '../utils/colors';
import { useRenderSeed } from '../hooks/useRenderSeed';

export const ParticleLatticeLayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { intensity, beatPulse, accentColor } = useActivePhase();
  const seed = useRenderSeed();

  // Particle count scales with intensity
  const particleCount = Math.floor(80 + intensity * 180);
  const breatheAmp = 8 + intensity * 15;
  const maxDist = 120 + intensity * 60;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const particles = generateParticleGrid(particleCount, width, height, frame, breatheAmp, seed);
    const connections = findConnections(particles, maxDist);

    // Parse accent color for canvas
    const particleColor = lerpColor(DJSAMSI.twilightPurple, accentColor, intensity);
    const r = parseInt(particleColor.slice(1, 3), 16);
    const g = parseInt(particleColor.slice(3, 5), 16);
    const b = parseInt(particleColor.slice(5, 7), 16);

    // Draw connections
    connections.forEach(([i, j, dist]) => {
      const alpha = (1 - dist / maxDist) * (0.15 + beatPulse * 0.12 * intensity);
      const lineWidth = (1 - dist / maxDist) * (0.5 + intensity * 1.5);
      ctx.beginPath();
      ctx.moveTo(particles[i].x, particles[i].y);
      ctx.lineTo(particles[j].x, particles[j].y);
      ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    });

    // Draw particles
    particles.forEach((p) => {
      const glowSize = p.size * (1.5 + beatPulse * intensity);
      const alpha = 0.3 + intensity * 0.5 + beatPulse * 0.15;

      // Glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowSize * 2, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize * 2);
      grad.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.3})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowSize * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();
    });
  }, [frame, width, height, intensity, beatPulse, particleCount, breatheAmp, maxDist, accentColor, seed]);

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
