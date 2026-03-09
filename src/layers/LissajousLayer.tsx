import React, { useRef, useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { useActivePhase } from '../hooks/phase-context';
import { useRenderSeed } from '../hooks/useRenderSeed';

// Lissajous curves — parametric figures from frequency ratios.
// Musical intervals map directly to visual harmony:
//   1:1 = circle, 2:3 = figure-8 variant, 3:4 = trefoil, etc.
// Audio energy modulates the frequency ratio and phase offset.

const POINTS = 800;
const TWO_PI = Math.PI * 2;

export const LissajousLayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { intensity, beatPulse, bassEnergy, midEnergy, trebleEnergy, accentColor } = useActivePhase();
  const seed = useRenderSeed();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.min(width, height) * 0.35;

    const r = parseInt(accentColor.slice(1, 3), 16);
    const g = parseInt(accentColor.slice(3, 5), 16);
    const b = parseInt(accentColor.slice(5, 7), 16);

    // Draw multiple Lissajous curves with different ratios
    const curves = 2 + Math.floor(intensity * 3); // 2-5 curves
    const time = frame * 0.01;

    for (let c = 0; c < curves; c++) {
      const seedOffset = ((seed + c * 137) % 100) / 100;

      // Frequency ratios — musical intervals modulated by audio
      const baseA = 1 + c;
      const baseB = 2 + c + Math.floor(bassEnergy * 2);
      const freqA = baseA + Math.sin(time * 0.3 + seedOffset * TWO_PI) * midEnergy * 0.5;
      const freqB = baseB + Math.cos(time * 0.2 + seedOffset * TWO_PI) * trebleEnergy * 0.5;

      // Phase offset rotates the figure
      const phase = time * (0.5 + c * 0.2) + beatPulse * 0.3;

      // Size decreases for inner curves
      const scale = maxR * (1 - c * 0.15);
      const alpha = (0.15 + intensity * 0.35) * (1 - c * 0.12);

      ctx.beginPath();
      for (let i = 0; i <= POINTS; i++) {
        const t = (i / POINTS) * TWO_PI;
        const x = cx + Math.sin(freqA * t + phase) * scale;
        const y = cy + Math.sin(freqB * t) * scale * 0.8;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      // Color shifts per curve
      const hueShift = c * 30;
      ctx.strokeStyle = `rgba(${Math.min(255, r + hueShift)},${g},${Math.max(0, b - hueShift)},${alpha})`;
      ctx.lineWidth = 1 + intensity * 1.5 - c * 0.3;
      ctx.stroke();
    }

    // Beat-reactive center glow
    if (beatPulse > 0.5) {
      const glowRadius = 20 + beatPulse * 40;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
      grad.addColorStop(0, `rgba(${r},${g},${b},${(beatPulse - 0.5) * 0.3})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.arc(cx, cy, glowRadius, 0, TWO_PI);
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }, [frame, width, height, intensity, beatPulse, bassEnergy, midEnergy, trebleEnergy, accentColor, seed]);

  return (
    <AbsoluteFill>
      <canvas ref={canvasRef} width={width} height={height} style={{ width: '100%', height: '100%' }} />
    </AbsoluteFill>
  );
};
