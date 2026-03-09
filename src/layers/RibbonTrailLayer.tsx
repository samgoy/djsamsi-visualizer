import React, { useRef, useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { useActivePhase } from '../hooks/phase-context';
import { useRenderSeed } from '../hooks/useRenderSeed';
import { createNoise } from '../utils/noise';

// Ribbon trails — flowing particle ribbons with persistence/trail effect.
// Multiple ribbons flow through a noise field, leaving fading trails.
// Creates silk-like flowing fabric textures. Bass widens ribbons, treble adds flutter.

const MAX_RIBBONS = 8;
const TRAIL_LENGTH = 60;

export const RibbonTrailLayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { intensity, beatPulse, bassEnergy, trebleEnergy, accentColor } = useActivePhase();
  const seed = useRenderSeed();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Lazy-init trail canvas for persistence effect
    if (!trailCanvasRef.current) {
      trailCanvasRef.current = document.createElement('canvas');
      trailCanvasRef.current.width = width;
      trailCanvasRef.current.height = height;
    }
    const trailCanvas = trailCanvasRef.current;
    if (trailCanvas.width !== width || trailCanvas.height !== height) {
      trailCanvas.width = width;
      trailCanvas.height = height;
    }
    const trailCtx = trailCanvas.getContext('2d')!;

    // Fade previous frame (trail persistence)
    const fadeAmount = 0.03 + (1 - intensity) * 0.04; // slower fade at high intensity
    trailCtx.fillStyle = `rgba(0,0,0,${fadeAmount})`;
    trailCtx.fillRect(0, 0, width, height);

    const { noise2D } = createNoise(seed);
    const time = frame * 0.005;

    const r = parseInt(accentColor.slice(1, 3), 16);
    const g = parseInt(accentColor.slice(3, 5), 16);
    const b = parseInt(accentColor.slice(5, 7), 16);

    const ribbonCount = 3 + Math.floor(intensity * (MAX_RIBBONS - 3));

    for (let ri = 0; ri < ribbonCount; ri++) {
      const ribbonSeed = seed * 100 + ri * 73;
      const rng = (s: number) => {
        s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
        return ((s ^ (s >>> 16)) >>> 0) / 4294967296;
      };

      // Ribbon head position follows noise field
      const startX = rng(ribbonSeed) * width;
      const startY = rng(ribbonSeed + 1) * height;
      const speed = 1.5 + rng(ribbonSeed + 2) * 2;

      // Build trail by stepping through noise field
      const points: { x: number; y: number }[] = [];
      let px = startX;
      let py = startY;

      for (let t = 0; t < TRAIL_LENGTH; t++) {
        const tOffset = (frame - t) * 0.008;
        const nx = px / width * 3;
        const ny = py / height * 3;

        const angle = noise2D(nx + tOffset, ny) * Math.PI * 2;
        const flutter = trebleEnergy * Math.sin(t * 0.5 + frame * 0.3) * 3;

        px += Math.cos(angle) * speed + flutter;
        py += Math.sin(angle) * speed;

        // Wrap around screen
        px = ((px % width) + width) % width;
        py = ((py % height) + height) % height;

        points.push({ x: px, y: py });
      }

      // Draw ribbon as a thick line with tapering
      const baseWidth = 2 + bassEnergy * 6 + beatPulse * 3;
      const hueShift = ri * 25;
      const alpha = 0.2 + intensity * 0.4;

      for (let i = 1; i < points.length; i++) {
        const taper = 1 - i / points.length; // thin toward tail
        const lineWidth = baseWidth * taper;
        if (lineWidth < 0.3) continue;

        const segAlpha = alpha * taper;
        trailCtx.beginPath();
        trailCtx.moveTo(points[i - 1].x, points[i - 1].y);
        trailCtx.lineTo(points[i].x, points[i].y);
        trailCtx.strokeStyle = `rgba(${Math.min(255, r + hueShift)},${g},${Math.max(0, b - hueShift)},${segAlpha})`;
        trailCtx.lineWidth = lineWidth;
        trailCtx.lineCap = 'round';
        trailCtx.stroke();
      }

      // Glowing head
      if (points.length > 0) {
        const head = points[0];
        const glowR = 4 + beatPulse * 6;
        const grad = trailCtx.createRadialGradient(head.x, head.y, 0, head.x, head.y, glowR);
        grad.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.8})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        trailCtx.beginPath();
        trailCtx.arc(head.x, head.y, glowR, 0, Math.PI * 2);
        trailCtx.fillStyle = grad;
        trailCtx.fill();
      }
    }

    // Copy trail canvas to main canvas
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(trailCanvas, 0, 0);
  }, [frame, width, height, intensity, beatPulse, bassEnergy, trebleEnergy, accentColor, seed]);

  return (
    <AbsoluteFill>
      <canvas ref={canvasRef} width={width} height={height} style={{ width: '100%', height: '100%' }} />
    </AbsoluteFill>
  );
};
