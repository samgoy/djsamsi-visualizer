import React, { useRef, useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { useActivePhase } from '../hooks/phase-context';

// Circular spectrum bars — classic audio visualizer arranged in a circle.
// Uses bass/mid/treble bands for 3-zone height distribution.
// Inspired by remotion-dev/template-music-visualization.

const BAR_COUNT = 64;
const TWO_PI = Math.PI * 2;

export const SpectrumBarsLayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { intensity, beatPulse, bassEnergy, midEnergy, trebleEnergy, accentColor } = useActivePhase();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const innerRadius = Math.min(width, height) * 0.15;
    const maxBarHeight = Math.min(width, height) * 0.2;

    const r = parseInt(accentColor.slice(1, 3), 16);
    const g = parseInt(accentColor.slice(3, 5), 16);
    const b = parseInt(accentColor.slice(5, 7), 16);

    // Simulate spectrum: each bar gets a "frequency" zone
    for (let i = 0; i < BAR_COUNT; i++) {
      const angle = (i / BAR_COUNT) * TWO_PI - Math.PI / 2;
      const barFrac = i / BAR_COUNT; // 0=low freq, 1=high freq

      // Map bar to frequency band energy
      let bandEnergy: number;
      if (barFrac < 0.33) {
        bandEnergy = bassEnergy;
      } else if (barFrac < 0.66) {
        bandEnergy = midEnergy;
      } else {
        bandEnergy = trebleEnergy;
      }

      // Add per-bar variation using sine
      const barPhase = Math.sin(frame * 0.05 + i * 0.7) * 0.3 + 0.7;
      const barHeight = maxBarHeight * bandEnergy * barPhase * intensity;

      if (barHeight < 1) continue;

      const x1 = cx + Math.cos(angle) * innerRadius;
      const y1 = cy + Math.sin(angle) * innerRadius;
      const x2 = cx + Math.cos(angle) * (innerRadius + barHeight);
      const y2 = cy + Math.sin(angle) * (innerRadius + barHeight);

      // Color varies by zone: warm bass, neutral mid, cool treble
      const hueShift = barFrac * 60 - 30; // -30 to +30 degrees
      const alpha = 0.3 + intensity * 0.5 + beatPulse * 0.1;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `rgba(${Math.min(255, r + hueShift)},${g},${Math.max(0, b - hueShift)},${alpha})`;
      ctx.lineWidth = 2 + intensity * 2;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Glow on peak bars
      if (bandEnergy > 0.7 && barPhase > 0.85) {
        ctx.beginPath();
        ctx.arc(x2, y2, 3 + beatPulse * 4, 0, TWO_PI);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.4})`;
        ctx.fill();
      }
    }
  }, [frame, width, height, intensity, beatPulse, bassEnergy, midEnergy, trebleEnergy, accentColor]);

  return (
    <AbsoluteFill>
      <canvas ref={canvasRef} width={width} height={height} style={{ width: '100%', height: '100%' }} />
    </AbsoluteFill>
  );
};
