import React, { useRef, useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { useActivePhase } from '../hooks/phase-context';

// Strobe/pulse layer — concentric rings that expand outward from center.
// Creates tunnel-like depth effect. Intensity controls how many rings and speed.
// Inspired by Dreamachine alpha-frequency visual entrainment.

export const StrobePulseLayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { intensity, beatPulse, audioEnergy, accentColor, bpm } = useActivePhase();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.max(width, height) * 0.7;

    const r = parseInt(accentColor.slice(1, 3), 16);
    const g = parseInt(accentColor.slice(3, 5), 16);
    const b = parseInt(accentColor.slice(5, 7), 16);

    // Ring count and speed tied to BPM
    const ringCount = 8 + Math.floor(intensity * 12); // 8-20 rings
    const speed = (bpm / 60) * 0.8; // rings per second, roughly
    const time = frame * speed * 0.02;

    for (let i = 0; i < ringCount; i++) {
      // Each ring expands outward continuously
      const phase = (i / ringCount + time) % 1.0;
      const radius = phase * maxR;

      // Fade in near center, fade out at edges
      const fadeIn = Math.min(1, radius / (maxR * 0.15));
      const fadeOut = 1 - Math.pow(phase, 1.5);
      const baseAlpha = fadeIn * fadeOut * (0.03 + intensity * 0.08);

      // Beat modulation — rings pulse brighter on beat
      const beatMod = 1 + beatPulse * 0.5 * intensity;
      const alpha = Math.min(0.4, baseAlpha * beatMod + audioEnergy * 0.02);

      // Ring width: thinner as they expand
      const lineWidth = (2 + intensity * 3) * fadeOut;

      if (alpha < 0.005 || lineWidth < 0.1) continue;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // Inner glow for the brightest rings
      if (phase < 0.3 && intensity > 0.5) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.3})`;
        ctx.lineWidth = lineWidth * 4;
        ctx.stroke();
      }
    }
  }, [frame, width, height, intensity, beatPulse, audioEnergy, accentColor, bpm]);

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
