import React, { useRef, useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { useActivePhase } from '../hooks/phase-context';
import { useRenderSeed } from '../hooks/useRenderSeed';

// Fluid flow field — streamlines that flow and swirl like ink in water.
// Uses a simple vector field with layered sine perturbations.
// Audio energy distorts the field, intensity increases particle count.

const MAX_STREAMLINES = 80;

export const FluidFlowLayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { intensity, beatPulse, audioEnergy, accentColor, color } = useActivePhase();
  const seed = useRenderSeed();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const parseHex = (hex: string) => [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
    const [ar, ag, ab] = parseHex(accentColor);
    const [cr, cg, cb] = parseHex(color);

    const time = frame * 0.006;
    const lineCount = Math.floor(30 + intensity * 50);
    const stepsPerLine = 40 + Math.floor(intensity * 30);

    // Seeded positions
    let s = (seed * 31337) | 0;
    const rand = () => {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    for (let i = 0; i < lineCount; i++) {
      let x = rand() * width;
      let y = rand() * height;
      const linePhase = rand() * Math.PI * 2;

      // Color blend per line
      const t = i / lineCount;
      const r = Math.round(cr + (ar - cr) * t);
      const g = Math.round(cg + (ag - cg) * t);
      const b = Math.round(cb + (ab - cb) * t);

      ctx.beginPath();
      ctx.moveTo(x, y);

      for (let step = 0; step < stepsPerLine; step++) {
        // Vector field: layered curl noise approximation
        const nx = x / width;
        const ny = y / height;

        const vx =
          Math.sin(ny * 4.0 + time * 1.5 + linePhase) * 2.0 +
          Math.cos(nx * 6.0 - time * 0.8 + seed * 0.1) * 1.5 +
          Math.sin((nx + ny) * 8.0 + time * 2.0) * audioEnergy * 3.0;

        const vy =
          Math.cos(nx * 4.0 - time * 1.2 + linePhase) * 2.0 +
          Math.sin(ny * 6.0 + time * 0.6 + seed * 0.2) * 1.5 +
          Math.cos((nx - ny) * 8.0 - time * 1.8) * audioEnergy * 3.0;

        x += vx;
        y += vy;

        // Wrap around edges
        if (x < 0) x += width;
        if (x > width) x -= width;
        if (y < 0) y += height;
        if (y > height) y -= height;

        ctx.lineTo(x, y);
      }

      const alpha = (0.04 + intensity * 0.08) * (0.8 + beatPulse * 0.3);
      ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.lineWidth = 1 + intensity * 1.5;
      ctx.stroke();
    }
  }, [frame, width, height, intensity, beatPulse, audioEnergy, accentColor, color, seed]);

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
