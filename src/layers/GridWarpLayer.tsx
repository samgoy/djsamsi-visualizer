import React, { useRef, useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { useActivePhase } from '../hooks/phase-context';
import { useRenderSeed } from '../hooks/useRenderSeed';
import { createNoise } from '../utils/noise';

// Grid warp — a regular grid that deforms with simplex noise + bass energy.
// The grid bends and warps like space-time distortion.
// Bass pushes the grid outward from center, treble makes it shimmer.

export const GridWarpLayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { intensity, beatPulse, bassEnergy, trebleEnergy, accentColor } = useActivePhase();
  const seed = useRenderSeed();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const { noise2D } = createNoise(seed);
    const time = frame * 0.008;
    const cols = 24;
    const rows = 16;
    const cellW = width / cols;
    const cellH = height / rows;

    const r = parseInt(accentColor.slice(1, 3), 16);
    const g = parseInt(accentColor.slice(3, 5), 16);
    const b = parseInt(accentColor.slice(5, 7), 16);

    // Compute warped grid positions
    const points: { x: number; y: number }[][] = [];
    for (let row = 0; row <= rows; row++) {
      points[row] = [];
      for (let col = 0; col <= cols; col++) {
        const baseX = col * cellW;
        const baseY = row * cellH;

        // Noise-based displacement
        const nx = col / cols;
        const ny = row / rows;
        const noiseX = noise2D(nx * 3 + time, ny * 3) * 30 * intensity;
        const noiseY = noise2D(nx * 3, ny * 3 + time * 0.8) * 30 * intensity;

        // Bass pushes outward from center
        const dx = baseX - width / 2;
        const dy = baseY - height / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = Math.sqrt(width * width + height * height) / 2;
        const pushStrength = bassEnergy * 20 * (1 - dist / maxDist);
        const pushX = dist > 0 ? (dx / dist) * pushStrength : 0;
        const pushY = dist > 0 ? (dy / dist) * pushStrength : 0;

        // Treble shimmer (high-frequency jitter)
        const shimmerX = Math.sin(col * 8 + frame * 0.3) * trebleEnergy * 3;
        const shimmerY = Math.cos(row * 8 + frame * 0.25) * trebleEnergy * 3;

        points[row][col] = {
          x: baseX + noiseX + pushX + shimmerX,
          y: baseY + noiseY + pushY + shimmerY,
        };
      }
    }

    // Draw grid lines
    const alpha = 0.08 + intensity * 0.15 + beatPulse * 0.05;
    ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
    ctx.lineWidth = 0.5 + intensity * 0.8;

    // Horizontal lines
    for (let row = 0; row <= rows; row++) {
      ctx.beginPath();
      ctx.moveTo(points[row][0].x, points[row][0].y);
      for (let col = 1; col <= cols; col++) {
        ctx.lineTo(points[row][col].x, points[row][col].y);
      }
      ctx.stroke();
    }

    // Vertical lines
    for (let col = 0; col <= cols; col++) {
      ctx.beginPath();
      ctx.moveTo(points[0][col].x, points[0][col].y);
      for (let row = 1; row <= rows; row++) {
        ctx.lineTo(points[row][col].x, points[row][col].y);
      }
      ctx.stroke();
    }

    // Intersection dots at high intensity
    if (intensity > 0.4) {
      const dotAlpha = (intensity - 0.4) * 0.5;
      for (let row = 0; row <= rows; row++) {
        for (let col = 0; col <= cols; col++) {
          const p = points[row][col];
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.5 + beatPulse * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${dotAlpha})`;
          ctx.fill();
        }
      }
    }
  }, [frame, width, height, intensity, beatPulse, bassEnergy, trebleEnergy, accentColor, seed]);

  return (
    <AbsoluteFill>
      <canvas ref={canvasRef} width={width} height={height} style={{ width: '100%', height: '100%' }} />
    </AbsoluteFill>
  );
};
