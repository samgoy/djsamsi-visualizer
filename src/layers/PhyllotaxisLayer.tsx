import React, { useRef, useEffect } from 'react';
import { useCurrentFrame, useVideoConfig, AbsoluteFill } from 'remotion';
import { useActivePhase } from '../hooks/phase-context';

// Phyllotaxis: sunflower spiral using the golden angle
// Audio-reactive: angle offset → intensity, dot count → bass, dot size → amplitude

const GOLDEN_ANGLE = 137.508; // degrees

export const PhyllotaxisLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { intensity, beatPulse, bpm, accentColor, color } = useActivePhase();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const maxRadius = Math.min(width, height) * 0.42;

    // Audio-reactive parameters
    const angleOffset = GOLDEN_ANGLE + intensity * 0.15; // tiny shift = dramatic restructure
    const dotCount = Math.floor(200 + intensity * 600); // 200 quiet, 800 loud
    const baseDotSize = 1.5 + intensity * 3;
    const breathing = 1 + Math.sin(frame * 0.02) * 0.05 * (1 + intensity);
    const rotationSpeed = (bpm / 120) * 0.3;
    const globalRotation = (frame * rotationSpeed * Math.PI) / 180;

    for (let i = 0; i < dotCount; i++) {
      const angle = i * angleOffset * (Math.PI / 180) + globalRotation;
      const radius = Math.sqrt(i / dotCount) * maxRadius * breathing;

      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);

      // Size varies: larger near center, pulsing with beat
      const distFromCenter = radius / maxRadius;
      const sizePulse = 1 + beatPulse * 0.5 * (1 - distFromCenter);
      const dotSize = baseDotSize * sizePulse * (0.5 + 0.5 * (1 - distFromCenter));

      // Color: gradient from center outward
      const t = distFromCenter;
      const alpha = (0.3 + intensity * 0.6) * (1 - t * 0.5);

      ctx.beginPath();
      ctx.arc(x, y, dotSize, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(accentColor, alpha);
      ctx.fill();

      // Glow on beat for inner dots
      if (beatPulse > 0.7 && distFromCenter < 0.3) {
        ctx.beginPath();
        ctx.arc(x, y, dotSize * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(accentColor, alpha * 0.2);
        ctx.fill();
      }
    }
  }, [frame, width, height, intensity, beatPulse, bpm, accentColor, color]);

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

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
