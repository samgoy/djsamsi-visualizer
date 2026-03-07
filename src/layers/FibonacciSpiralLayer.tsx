import React, { useRef, useEffect } from 'react';
import { useCurrentFrame, useVideoConfig, AbsoluteFill } from 'remotion';
import { useActivePhase } from '../hooks/phase-context';

// Fibonacci Spiral: golden ratio (φ = 1.618...) quarter-circle arcs
// Audio-reactive: rotation → BPM, scale breathing → bass, trail opacity → intensity

const PHI = (1 + Math.sqrt(5)) / 2; // golden ratio

export const FibonacciSpiralLayer: React.FC = () => {
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

    // Audio-reactive parameters
    const rotationSpeed = (bpm / 60) * 0.5;
    const rotation = (frame * rotationSpeed * Math.PI) / 180;
    const breathing = 1 + beatPulse * 0.08;
    const spiralCount = 2 + Math.floor(intensity * 2); // 2-4 spirals
    const segmentCount = 12 + Math.floor(intensity * 8); // more segments when loud

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.scale(breathing, breathing);

    for (let s = 0; s < spiralCount; s++) {
      const spiralRotation = (s / spiralCount) * Math.PI * 2;
      ctx.save();
      ctx.rotate(spiralRotation);

      // Draw fibonacci spiral as connected quarter-circle arcs
      let scale = 2;
      let x = 0;
      let y = 0;

      ctx.beginPath();
      ctx.moveTo(0, 0);

      for (let i = 0; i < segmentCount; i++) {
        const arcRadius = scale;
        const startAngle = (i * Math.PI) / 2;
        const endAngle = ((i + 1) * Math.PI) / 2;

        // Determine arc center based on spiral direction
        const arcCx = x + arcRadius * Math.cos(startAngle + Math.PI);
        const arcCy = y + arcRadius * Math.sin(startAngle + Math.PI);

        ctx.arc(arcCx, arcCy, arcRadius, startAngle, endAngle);

        // Move to next position
        x += arcRadius * (Math.cos(endAngle) - Math.cos(startAngle));
        y += arcRadius * (Math.sin(endAngle) - Math.sin(startAngle));

        scale *= PHI * 0.5; // scale up each segment
      }

      // Fade trail
      const alpha = 0.2 + intensity * 0.5;
      ctx.strokeStyle = hexToRgba(accentColor, alpha / spiralCount);
      ctx.lineWidth = 1.5 + intensity * 2;
      ctx.stroke();

      // Glow effect
      if (intensity > 0.3) {
        ctx.strokeStyle = hexToRgba(accentColor, alpha * 0.15);
        ctx.lineWidth = 4 + intensity * 6;
        ctx.stroke();
      }

      ctx.restore();
    }

    // Central dot (pulses with beat)
    const centerSize = 3 + beatPulse * 8 * intensity;
    ctx.beginPath();
    ctx.arc(0, 0, centerSize, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(accentColor, 0.6 + beatPulse * 0.4);
    ctx.fill();

    ctx.restore();
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
