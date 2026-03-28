import React, { useRef, useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { useActivePhase } from '../hooks/phase-context';
import { useRenderSeed } from '../hooks/useRenderSeed';
import { hexToRgba } from '../utils/colors';

// Sacred geometry: rose curves, Sri Yantra triangles, bindu (center dot).
// Lightweight canvas layer — ~2000 line segments + 9 triangles + 1 gradient.

const TWO_PI = Math.PI * 2;

export const YantraLayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const phase = useActivePhase();
  const seed = useRenderSeed();

  const { intensity, beatPulse, color, accentColor } = phase;
  const palette = 'palette' in phase ? (phase as any).palette as string[] : [color, accentColor];
  const beatImpact = 'beatImpact' in phase ? (phase as any).beatImpact as number : 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const timeSec = frame / fps;
    const baseRadius = Math.min(width, height) * 0.28;

    // Petal count from seed (3-12)
    const petalCount = 3 + (seed % 10);

    // ─── Rose Curves ───
    ctx.lineWidth = 1.2 + intensity * 0.8;
    const roseCount = 2 + Math.floor(intensity);
    for (let r = 0; r < roseCount; r++) {
      const radius = baseRadius * (0.5 + r * 0.3);
      const n = petalCount + r * 2;
      const timeOffset = timeSec * (0.15 + r * 0.08) * (r % 2 === 0 ? 1 : -1);
      const amplitude = 0.3 + intensity * 0.15;
      const palColor = palette[r % palette.length] || accentColor;

      ctx.strokeStyle = hexToRgba(palColor, 0.3 + intensity * 0.3);
      ctx.beginPath();

      const steps = 200 + n * 10;
      for (let i = 0; i <= steps; i++) {
        const theta = (i / steps) * TWO_PI * (n % 2 === 0 ? 2 : 1);
        const rr = radius + radius * amplitude * Math.sin(n * theta + timeOffset);
        const x = cx + rr * Math.cos(theta + timeOffset * 0.3);
        const y = cy + rr * Math.sin(theta + timeOffset * 0.3);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // ─── Sri Yantra Triangles (4 up + 5 down) ───
    const triRadius = baseRadius * (0.35 + intensity * 0.1);
    const rotSpeed = timeSec * 0.03;
    ctx.lineWidth = 1 + intensity * 0.6;

    // Upward triangles (4)
    for (let i = 0; i < 4; i++) {
      const scale = 0.5 + i * 0.15;
      const rot = rotSpeed + i * 0.2;
      drawTriangle(ctx, cx, cy, triRadius * scale, rot, false, color, intensity);
    }

    // Downward triangles (5)
    for (let i = 0; i < 5; i++) {
      const scale = 0.45 + i * 0.14;
      const rot = -rotSpeed + i * 0.18;
      drawTriangle(ctx, cx, cy, triRadius * scale, rot, true, accentColor, intensity);
    }

    // ─── Bindu (center dot with radial glow) ───
    const binduRadius = 4 + beatPulse * 3 * intensity + beatImpact * 8;
    const glowRadius = binduRadius * (3 + beatImpact * 4);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
    grad.addColorStop(0, hexToRgba(accentColor, 0.6 + beatImpact * 0.4));
    grad.addColorStop(0.3, hexToRgba(accentColor, 0.2 + beatImpact * 0.2));
    grad.addColorStop(1, hexToRgba(accentColor, 0));

    ctx.beginPath();
    ctx.arc(cx, cy, glowRadius, 0, TWO_PI);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, binduRadius, 0, TWO_PI);
    ctx.fillStyle = hexToRgba(accentColor, 0.8 + beatImpact * 0.2);
    ctx.fill();
  }, [frame, width, height, fps, intensity, beatPulse, beatImpact, color, accentColor, palette, seed]);

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

function drawTriangle(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  radius: number, rotation: number,
  inverted: boolean,
  strokeColor: string, intensity: number,
) {
  const dir = inverted ? -1 : 1;
  ctx.strokeStyle = hexToRgba(strokeColor, 0.2 + intensity * 0.25);
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const angle = rotation + (i * TWO_PI / 3) + (dir > 0 ? -Math.PI / 2 : Math.PI / 2);
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
}
