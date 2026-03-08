import React, { useRef, useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { useActivePhase } from '../hooks/phase-context';
import { useRenderSeed } from '../hooks/useRenderSeed';

// Kaleidoscope — draws a pattern in one segment then mirrors it N times.
// The source pattern is layered circles/lines that drift with audio.
// Creates infinite symmetry — deeply psychedelic when combined with color shifts.

export const KaleidoscopeLayer: React.FC = () => {
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

    const cx = width / 2;
    const cy = height / 2;
    const time = frame * 0.008;

    const parseHex = (hex: string) => [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
    const [ar, ag, ab] = parseHex(accentColor);
    const [cr, cg, cb] = parseHex(color);

    // Mirror count: 4 at rest, up to 8 at peak
    const mirrors = Math.floor(4 + intensity * 4) * 2; // always even for clean symmetry
    const sliceAngle = (Math.PI * 2) / mirrors;

    // Draw source pattern into one slice, then replicate
    ctx.save();
    ctx.translate(cx, cy);

    // Global slow rotation
    ctx.rotate(frame * 0.003 + seed * 0.1);

    for (let m = 0; m < mirrors; m++) {
      ctx.save();
      ctx.rotate(sliceAngle * m);

      // Mirror every other slice (true kaleidoscope)
      if (m % 2 === 1) {
        ctx.scale(1, -1);
      }

      // Clip to slice
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(0) * width, Math.sin(0) * width);
      ctx.lineTo(Math.cos(sliceAngle) * width, Math.sin(sliceAngle) * width);
      ctx.closePath();
      ctx.clip();

      // Draw source pattern: drifting circles and arcs
      const elementCount = 4 + Math.floor(intensity * 6);

      for (let i = 0; i < elementCount; i++) {
        const phase = seed * 0.1 + i * 2.3;
        const dist = 50 + i * 35 + Math.sin(time * 1.5 + phase) * 30 * audioEnergy;
        const angle = i * 0.4 + time * 0.3 + phase * 0.2;
        const ex = Math.cos(angle) * dist;
        const ey = Math.sin(angle) * dist * 0.5; // compress vertically into slice

        const size = 8 + i * 5 + beatPulse * 10 * intensity;

        // Color gradient through elements
        const t = i / elementCount;
        const r = Math.round(cr + (ar - cr) * t);
        const g = Math.round(cg + (ag - cg) * t);
        const b = Math.round(cb + (ab - cb) * t);
        const alpha = (0.06 + intensity * 0.1) * (0.7 + beatPulse * 0.3);

        // Circle
        ctx.beginPath();
        ctx.arc(ex, ey, size, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.lineWidth = 1 + intensity;
        ctx.stroke();

        // Arc
        ctx.beginPath();
        ctx.arc(ex * 0.7, ey * 1.3, size * 1.5, 0, Math.PI * 0.7);
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.5})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      ctx.restore();
    }

    ctx.restore();
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
