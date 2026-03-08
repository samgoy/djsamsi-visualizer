import React, { useRef, useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { useActivePhase } from '../hooks/phase-context';
import { useRenderSeed } from '../hooks/useRenderSeed';

// Circular waveform ring — deforms with audio energy, rotates with BPM.
// Inspired by r3f-audio-visualizer and remotion-audio-visualizers.

const POINT_COUNT = 128;
const TWO_PI = Math.PI * 2;

export const WaveformRingLayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { intensity, beatPulse, audioEnergy, accentColor, bpm } = useActivePhase();
  const seed = useRenderSeed();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const baseRadius = Math.min(width, height) * 0.22;
    const time = frame * 0.015;

    // Parse accent color
    const r = parseInt(accentColor.slice(1, 3), 16);
    const g = parseInt(accentColor.slice(3, 5), 16);
    const b = parseInt(accentColor.slice(5, 7), 16);

    // Draw multiple rings with different displacement harmonics
    const ringCount = 2 + Math.floor(intensity * 2); // 2-4 rings

    for (let ring = 0; ring < ringCount; ring++) {
      const ringOffset = ring * 0.25;
      const radiusMul = 1 + ring * 0.18;
      const ringAlpha = (0.15 + intensity * 0.35) / (1 + ring * 0.4);

      ctx.beginPath();

      for (let i = 0; i <= POINT_COUNT; i++) {
        const angle = (i / POINT_COUNT) * TWO_PI;
        const seedPhase = seed * 0.1 + ring * 1.7;

        // Multi-harmonic displacement driven by audioEnergy
        const h1 = Math.sin(angle * 3 + time * 2.1 + seedPhase) * audioEnergy * 40;
        const h2 = Math.sin(angle * 5 - time * 1.4 + seedPhase * 0.7) * audioEnergy * 20;
        const h3 = Math.sin(angle * 8 + time * 3.2 + seedPhase * 1.3) * audioEnergy * 10;
        const h4 = Math.sin(angle * 13 - time * 0.8 + seedPhase * 2.1) * intensity * 8;

        // Beat pulse adds uniform expansion
        const beatExpand = beatPulse * 15 * intensity;

        const radius = baseRadius * radiusMul + h1 + h2 + h3 + h4 + beatExpand;

        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.closePath();

      // Glow pass
      ctx.strokeStyle = `rgba(${r},${g},${b},${ringAlpha * 0.3})`;
      ctx.lineWidth = 6 + intensity * 4;
      ctx.stroke();

      // Sharp pass
      ctx.strokeStyle = `rgba(${r},${g},${b},${ringAlpha})`;
      ctx.lineWidth = 1.5 + intensity * 1;
      ctx.stroke();
    }

    // Center glow dot
    const centerSize = 4 + beatPulse * 10 * intensity;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, centerSize * 3);
    grad.addColorStop(0, `rgba(${r},${g},${b},${0.4 + beatPulse * 0.3})`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.beginPath();
    ctx.arc(cx, cy, centerSize * 3, 0, TWO_PI);
    ctx.fillStyle = grad;
    ctx.fill();
  }, [frame, width, height, intensity, beatPulse, audioEnergy, accentColor, bpm, seed]);

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
