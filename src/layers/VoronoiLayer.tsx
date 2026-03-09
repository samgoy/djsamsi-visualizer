import React, { useRef, useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { useActivePhase } from '../hooks/phase-context';
import { useRenderSeed } from '../hooks/useRenderSeed';

// Voronoi tessellation — organic cell/crystal patterns.
// Points drift with noise-like motion; cells colored by distance to edge.
// Bass energy pushes cells outward from center, treble agitates point positions.

const NUM_POINTS = 32;
const SAMPLE_STEP = 4; // pixel step for approximate Voronoi (performance)

interface VPoint {
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
}

export const VoronoiLayer: React.FC = () => {
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

    // Generate stable point positions from seed
    const rng = (s: number) => {
      s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
      s = Math.imul(s ^ (s >>> 13), 0x45d9f3b);
      return ((s ^ (s >>> 16)) >>> 0) / 4294967296;
    };

    const points: VPoint[] = [];
    for (let i = 0; i < NUM_POINTS; i++) {
      const s = seed * 1000 + i * 137;
      points.push({
        baseX: rng(s) * width,
        baseY: rng(s + 1) * height,
        vx: (rng(s + 2) - 0.5) * 2,
        vy: (rng(s + 3) - 0.5) * 2,
      });
    }

    // Animate points
    const time = frame * 0.02;
    const animatedPoints = points.map((p, i) => {
      const driftX = Math.sin(time + i * 1.7) * 40 + p.vx * time * 5;
      const driftY = Math.cos(time * 0.8 + i * 2.3) * 40 + p.vy * time * 5;

      // Bass pushes from center
      const dx = p.baseX - width / 2;
      const dy = p.baseY - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const push = bassEnergy * 30;
      const pushX = (dx / dist) * push;
      const pushY = (dy / dist) * push;

      // Treble jitter
      const jitterX = Math.sin(i * 11 + frame * 0.4) * trebleEnergy * 15;
      const jitterY = Math.cos(i * 13 + frame * 0.35) * trebleEnergy * 15;

      return {
        x: ((p.baseX + driftX + pushX + jitterX) % width + width) % width,
        y: ((p.baseY + driftY + pushY + jitterY) % height + height) % height,
      };
    });

    const r = parseInt(accentColor.slice(1, 3), 16);
    const g = parseInt(accentColor.slice(3, 5), 16);
    const b = parseInt(accentColor.slice(5, 7), 16);

    // Approximate Voronoi via sampling (much faster than exact)
    const sw = Math.ceil(width / SAMPLE_STEP);
    const sh = Math.ceil(height / SAMPLE_STEP);
    const imgData = ctx.createImageData(sw, sh);
    const data = imgData.data;

    for (let sy = 0; sy < sh; sy++) {
      const py = sy * SAMPLE_STEP;
      for (let sx = 0; sx < sw; sx++) {
        const px = sx * SAMPLE_STEP;

        // Find two nearest points
        let minDist = Infinity;
        let minDist2 = Infinity;
        for (let i = 0; i < animatedPoints.length; i++) {
          const dx = px - animatedPoints[i].x;
          const dy = py - animatedPoints[i].y;
          const d = dx * dx + dy * dy;
          if (d < minDist) {
            minDist2 = minDist;
            minDist = d;
          } else if (d < minDist2) {
            minDist2 = d;
          }
        }

        // Edge detection: ratio of nearest to second-nearest
        const edge = 1 - Math.sqrt(minDist) / Math.sqrt(minDist2);
        const edgeBright = Math.pow(edge, 0.5) * (0.3 + intensity * 0.7);

        // Pulse edges on beat
        const pulse = edgeBright * (1 + beatPulse * 0.3);

        const idx = (sy * sw + sx) * 4;
        data[idx] = Math.min(255, r * pulse);
        data[idx + 1] = Math.min(255, g * pulse);
        data[idx + 2] = Math.min(255, b * pulse);
        data[idx + 3] = Math.min(255, pulse * 180);
      }
    }

    // Scale up from sample grid
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sw;
    tempCanvas.height = sh;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(imgData, 0, 0);

    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(tempCanvas, 0, 0, width, height);

    // Draw cell center dots at high intensity
    if (intensity > 0.5) {
      const dotAlpha = (intensity - 0.5) * 0.6 + beatPulse * 0.2;
      ctx.fillStyle = `rgba(${r},${g},${b},${dotAlpha})`;
      for (const p of animatedPoints) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2 + beatPulse * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [frame, width, height, intensity, beatPulse, bassEnergy, trebleEnergy, accentColor, seed]);

  return (
    <AbsoluteFill>
      <canvas ref={canvasRef} width={width} height={height} style={{ width: '100%', height: '100%' }} />
    </AbsoluteFill>
  );
};
