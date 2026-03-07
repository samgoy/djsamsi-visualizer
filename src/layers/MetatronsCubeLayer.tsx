import React, { useRef, useEffect } from 'react';
import { useCurrentFrame, useVideoConfig, AbsoluteFill } from 'remotion';
import { useActivePhase } from '../hooks/phase-context';

// Metatron's Cube: 13 circles + 78 connecting lines
// Audio-reactive: 3D rotation → BPM, line reveal → beat drops, circle breathing → bass

// 13 circle positions in 2D (center + 6 inner + 6 outer)
function getMetatronPoints(radius: number): Array<[number, number, number]> {
  const points: Array<[number, number, number]> = [[0, 0, 0]]; // center

  // Inner ring (6 points)
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6;
    points.push([
      radius * Math.cos(angle),
      radius * Math.sin(angle),
      0,
    ]);
  }

  // Outer ring (6 points, rotated 30°)
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6 + Math.PI / 6;
    points.push([
      radius * 1.732 * Math.cos(angle), // √3 × radius
      radius * 1.732 * Math.sin(angle),
      0,
    ]);
  }

  return points;
}

// Simple 3D rotation (rotate around Y then X axis)
function rotate3D(
  point: [number, number, number],
  rotX: number,
  rotY: number,
): [number, number] {
  const [x, y, z] = point;

  // Rotate around Y
  const x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
  const z1 = x * Math.sin(rotY) + z * Math.cos(rotY);

  // Rotate around X
  const y1 = y * Math.cos(rotX) - z1 * Math.sin(rotX);

  return [x1, y1];
}

export const MetatronsCubeLayer: React.FC = () => {
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
    const baseRadius = Math.min(width, height) * 0.12;

    // Audio-reactive params
    const rotSpeed = (bpm / 120) * 0.4;
    const rotY = (frame * rotSpeed * Math.PI) / 180;
    const rotX = Math.sin(frame * 0.005) * 0.3 * intensity;
    const breathing = 1 + beatPulse * 0.04;
    const circleRadius = baseRadius * 0.25 * (1 + intensity * 0.3);

    // Get 3D-rotated 2D projections
    const points3D = getMetatronPoints(baseRadius * breathing);
    const points2D = points3D.map((p) => rotate3D(p, rotX, rotY));

    // Draw connecting lines (78 total — all pairs of 13 points)
    const lineReveal = Math.floor(intensity * 78); // more lines at higher intensity
    const allPairs: Array<[number, number]> = [];
    for (let i = 0; i < 13; i++) {
      for (let j = i + 1; j < 13; j++) {
        allPairs.push([i, j]);
      }
    }

    // Sort by distance (draw closer lines first for depth)
    allPairs.sort((a, b) => {
      const distA = Math.hypot(
        points2D[a[0]][0] - points2D[a[1]][0],
        points2D[a[0]][1] - points2D[a[1]][1],
      );
      const distB = Math.hypot(
        points2D[b[0]][0] - points2D[b[1]][0],
        points2D[b[0]][1] - points2D[b[1]][1],
      );
      return distA - distB;
    });

    // Draw lines
    for (let i = 0; i < Math.min(lineReveal, allPairs.length); i++) {
      const [a, b] = allPairs[i];
      const [ax, ay] = points2D[a];
      const [bx, by] = points2D[b];

      const lineAlpha = (0.05 + intensity * 0.2) * (1 - i / 78);

      ctx.beginPath();
      ctx.moveTo(cx + ax, cy + ay);
      ctx.lineTo(cx + bx, cy + by);
      ctx.strokeStyle = hexToRgba(color, lineAlpha);
      ctx.lineWidth = 0.5 + intensity;
      ctx.stroke();
    }

    // Draw circles
    for (let i = 0; i < 13; i++) {
      const [x, y] = points2D[i];
      const isCenter = i === 0;
      const isInner = i >= 1 && i <= 6;

      // Size varies by ring
      const r = isCenter
        ? circleRadius * 1.2
        : isInner
          ? circleRadius
          : circleRadius * 0.8;

      // Beat pulse on center and inner ring
      const pulse = isCenter || isInner ? beatPulse * 0.15 : 0;
      const finalR = r * (1 + pulse);

      const alpha = isCenter
        ? 0.4 + intensity * 0.4
        : isInner
          ? 0.2 + intensity * 0.3
          : 0.1 + intensity * 0.2;

      // Circle outline
      ctx.beginPath();
      ctx.arc(cx + x, cy + y, finalR, 0, Math.PI * 2);
      ctx.strokeStyle = hexToRgba(accentColor, alpha);
      ctx.lineWidth = 1 + intensity;
      ctx.stroke();

      // Inner glow
      if (intensity > 0.5) {
        ctx.beginPath();
        ctx.arc(cx + x, cy + y, finalR * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(accentColor, alpha * 0.2);
        ctx.fill();
      }
    }

    // Center point — bright dot
    const centerAlpha = 0.5 + beatPulse * 0.5;
    ctx.beginPath();
    ctx.arc(cx + points2D[0][0], cy + points2D[0][1], 3 + beatPulse * 4, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(accentColor, centerAlpha);
    ctx.fill();
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
