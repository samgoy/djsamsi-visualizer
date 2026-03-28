import React, { useRef, useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { useActivePhase } from '../hooks/phase-context';
import { useRenderSeed } from '../hooks/useRenderSeed';
import { hexToRgba } from '../utils/colors';
import { createNoise } from '../utils/noise';

// Sacred geometry: rose curves, Sri Yantra triangles, bindu (center dot).
// Primary visual element — dominant but elegant, not aggressive.

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

  // Audio band energies — bass/mid influence yantra subtly (10-15% of parameters)
  const bassEnergy = 'bassEnergy' in phase ? (phase as any).bassEnergy as number : 0;
  const midEnergy = 'midEnergy' in phase ? (phase as any).midEnergy as number : 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const timeSec = frame / fps;
    // Bass → subtle expansion (10-15% modulation on radius)
    const bassExpand = 1 + bassEnergy * 0.12;
    const baseRadius = Math.min(width, height) * 0.28 * bassExpand;

    // Noise for subtle geometric imperfection
    const noise = createNoise(seed + 777);

    // Organic rotation variation: speed oscillates smoothly (0.8x–1.2x)
    const rotSpeedMod = 0.8 + 0.4 * Math.sin(timeSec * 0.1);
    // Stillness phase: when intensity < 0.3, reduce rotation to ~25% of normal
    const stillnessFactor = intensity < 0.3 ? 0.25 + intensity * 2.5 : 1;
    const effectiveRotSpeed = 0.04 * rotSpeedMod * stillnessFactor;
    const globalRotation = timeSec * effectiveRotSpeed;

    // Motion amplitude reduction in stillness
    const motionScale = intensity < 0.3 ? 0.6 + intensity * 1.3 : 1;

    // Petal count from seed (3-12)
    const petalCount = 3 + (seed % 10);

    // ─── Rose Curves ───
    // Softened: ~12% thinner lines, ~12% less glow
    ctx.lineWidth = 2.2 + intensity * 0.7;
    const roseCount = 2 + Math.floor(intensity);
    for (let r = 0; r < roseCount; r++) {
      const radius = baseRadius * (0.5 + r * 0.3);
      const n = petalCount + r * 2;
      const timeOffset = timeSec * (0.15 + r * 0.08) * (r % 2 === 0 ? 1 : -1) * motionScale;
      // Mid → slight shape modulation (curvature breathes with midrange)
      const amplitude = 0.3 + intensity * 0.15 + midEnergy * 0.06;
      const palColor = palette[r % palette.length] || accentColor;

      // Outer curves softer than inner — reduces competition at peak
      const outerDim = r === 0 ? 1 : 0.85;
      const strokeAlpha = (0.38 + intensity * 0.32) * outerDim;
      ctx.strokeStyle = hexToRgba(palColor, strokeAlpha);

      // Softened glow
      ctx.shadowBlur = 19 + intensity * 7;
      ctx.shadowColor = hexToRgba(palColor, 0.45);

      ctx.beginPath();
      const steps = 200 + n * 10;
      for (let i = 0; i <= steps; i++) {
        const theta = (i / steps) * TWO_PI * (n % 2 === 0 ? 2 : 1);
        const wobble = noise.noise3D(theta * 2, r * 3.7, timeSec * 0.1) * 0.015;
        const rr = radius + radius * amplitude * Math.sin(n * theta + timeOffset);
        const angle = theta + timeOffset * 0.3 + globalRotation + wobble;
        const x = cx + rr * Math.cos(angle);
        const y = cy + rr * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // ─── Sri Yantra Triangles (4 up + 5 down) ───
    const triRadius = baseRadius * (0.35 + intensity * 0.1);
    const triRotSpeed = timeSec * 0.03 * rotSpeedMod * stillnessFactor;
    ctx.lineWidth = 1.8 + intensity * 0.7;

    // Upward triangles (4)
    for (let i = 0; i < 4; i++) {
      const scale = 0.5 + i * 0.15;
      const rot = triRotSpeed + globalRotation + i * 0.2;
      drawTriangle(ctx, cx, cy, triRadius * scale, rot, false, color, intensity, noise, timeSec, i);
    }

    // Downward triangles (5)
    for (let i = 0; i < 5; i++) {
      const scale = 0.45 + i * 0.14;
      const rot = -triRotSpeed + globalRotation + i * 0.18;
      drawTriangle(ctx, cx, cy, triRadius * scale, rot, true, accentColor, intensity, noise, timeSec, i + 4);
    }

    // ─── Bindu (center dot with radial glow) — the energy source ───
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    // Quadratic pulse: sharper attack, softer decay (more organic than linear)
    const pulse = beatImpact * beatImpact;

    // Micro life: subtle size oscillation (barely perceptible)
    const microLife = Math.sin(timeSec * 2) * 0.015;

    // Bass → slight bindu glow increase (adds warmth on bass hits)
    const bassGlow = bassEnergy * 0.15;
    const binduRadius = (6 + beatPulse * 5 * intensity + pulse * 10) * (1 + microLife + bassGlow);
    const glowRadius = binduRadius * (3.6 + pulse * 3.6);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
    grad.addColorStop(0, hexToRgba(accentColor, 0.68 + pulse * 0.22));
    grad.addColorStop(0.15, hexToRgba(accentColor, 0.40 + pulse * 0.22));
    grad.addColorStop(0.4, hexToRgba(accentColor, 0.10 + pulse * 0.10));
    grad.addColorStop(1, hexToRgba(accentColor, 0));

    ctx.beginPath();
    ctx.arc(cx, cy, glowRadius, 0, TWO_PI);
    ctx.fillStyle = grad;
    ctx.fill();

    // Solid bindu core
    ctx.beginPath();
    ctx.arc(cx, cy, binduRadius, 0, TWO_PI);
    ctx.fillStyle = hexToRgba(accentColor, 0.85 + pulse * 0.15);
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
  noise: ReturnType<typeof createNoise>, timeSec: number, triIndex: number,
) {
  const dir = inverted ? -1 : 1;
  const alpha = 0.28 + intensity * 0.28;
  ctx.strokeStyle = hexToRgba(strokeColor, alpha);

  // Softened glow for triangles
  ctx.shadowBlur = 16 + intensity * 5;
  ctx.shadowColor = hexToRgba(strokeColor, 0.35);

  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const baseAngle = rotation + (i * TWO_PI / 3) + (dir > 0 ? -Math.PI / 2 : Math.PI / 2);
    const wobble = noise.noise3D(triIndex * 5.3, i * 2.1, timeSec * 0.08) * 0.012;
    const angle = baseAngle + wobble;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
}
