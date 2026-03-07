import React, { useRef, useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { useActivePhase } from '../hooks/phase-context';
import { torusPoints } from '../utils/geometry';
import { DJSAMSI } from '../brand';

export const ToroidalFieldLayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { intensity, beatPulse, phase, globalProgress } = useActivePhase();

  // Torus mainly visible during cooldown
  const visibility = interpolate(
    globalProgress,
    [0.55, 0.65, 0.85, 0.95],
    [0, 0.6, 0.6, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (visibility < 0.01) return;

    const cx = width / 2;
    const cy = height / 2;

    // Flow speed — particles orbit the torus tube
    const phiOffset = frame * 0.04;

    const points = torusPoints(
      150,
      200,  // major radius
      80,   // minor radius
      phiOffset,
      400,  // focal length
      350,  // distance from camera
    );

    // Sort by depth for proper layering
    points.sort((a, b) => a.depth - b.depth);

    // Parse teal color
    const r = 42, g = 138, b = 122; // forestTeal

    points.forEach((p) => {
      const sx = cx + p.screenX;
      const sy = cy + p.screenY;
      const size = 1.5 + p.depth * 3 + beatPulse * 1;
      const alpha = (0.1 + p.depth * 0.6) * visibility;

      // Glow
      const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, size * 3);
      grad.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.4})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.arc(sx, sy, size * 3, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(sx, sy, size * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();
    });
  }, [frame, width, height, visibility, beatPulse]);

  if (visibility < 0.01) return null;

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
