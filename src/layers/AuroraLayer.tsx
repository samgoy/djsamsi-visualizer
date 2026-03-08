import React, { useRef, useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { useActivePhase } from '../hooks/phase-context';
import { useRenderSeed } from '../hooks/useRenderSeed';

// Aurora borealis — undulating curtains of light across the sky.
// Multiple vertical bands that shimmer and wave. Audio energy
// controls brightness and movement speed.

const BAND_COUNT = 5;

export const AuroraLayer: React.FC = () => {
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

    const time = frame * 0.004;

    for (let band = 0; band < BAND_COUNT; band++) {
      const bandPhase = seed * 0.3 + band * 1.7;
      const bandX = (band / BAND_COUNT) * width + Math.sin(time * 0.5 + bandPhase) * width * 0.1;
      const bandWidth = width * (0.15 + intensity * 0.1);

      // Color: blend between accent and phase color per band
      const t = band / BAND_COUNT;
      const r = Math.round(cr + (ar - cr) * t);
      const g = Math.round(cg + (ag - cg) * t);
      const b = Math.round(cb + (ab - cb) * t);

      // Draw the curtain as vertical gradient strips
      const segments = 60;
      for (let seg = 0; seg < segments; seg++) {
        const segY = (seg / segments) * height;
        const segHeight = height / segments + 1;

        // Horizontal wave displacement
        const wave =
          Math.sin(segY * 0.008 + time * 2.0 + bandPhase) * 30 +
          Math.sin(segY * 0.015 - time * 1.3 + bandPhase * 0.7) * 20 +
          Math.sin(segY * 0.004 + time * 0.5 + bandPhase * 1.3) * 50 * audioEnergy;

        const x = bandX + wave;

        // Brightness: stronger in upper portion (like real aurora)
        const heightFactor = 1 - (segY / height);
        const verticalFade = Math.pow(heightFactor, 0.8) * 0.7 + 0.3 * Math.pow(1 - heightFactor, 2);
        const alpha = verticalFade * (0.02 + intensity * 0.04) * (0.8 + beatPulse * 0.3);

        if (alpha < 0.003) continue;

        // Soft horizontal gradient for each segment
        const grad = ctx.createLinearGradient(x - bandWidth / 2, segY, x + bandWidth / 2, segY);
        grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
        grad.addColorStop(0.3, `rgba(${r},${g},${b},${alpha})`);
        grad.addColorStop(0.5, `rgba(${r},${g},${b},${alpha * 1.5})`);
        grad.addColorStop(0.7, `rgba(${r},${g},${b},${alpha})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

        ctx.fillStyle = grad;
        ctx.fillRect(x - bandWidth / 2, segY, bandWidth, segHeight);
      }
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
