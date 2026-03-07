import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { useActivePhase } from '../hooks/phase-context';
import { hexToRgba } from '../utils/colors';

const RAY_COUNT = 48;

export const EnergyRaysLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { intensity, beatPulse, audioEnergy, accentColor } = useActivePhase();

  // Rays only visible during warmup and peak
  if (intensity < 0.2) return null;

  const cx = width / 2;
  const cy = height / 2;
  const maxLen = Math.max(width, height) * 0.45;

  const rays: Array<{ angle: number; length: number; opacity: number; width: number }> = [];

  for (let i = 0; i < RAY_COUNT; i++) {
    const angle = (i / RAY_COUNT) * Math.PI * 2;
    const phaseOffset = i * 0.3;

    // Each ray pulses independently but synced to BPM
    const pulse = Math.sin(frame * 0.06 * (1 + intensity + audioEnergy * 0.6) + phaseOffset);
    const rayIntensity = (pulse + 1) / 2;

    const length = maxLen * (0.2 + rayIntensity * 0.8) * intensity * (0.75 + audioEnergy * 0.6);
    const opacity = (0.05 + rayIntensity * 0.2) * intensity + beatPulse * 0.1 * intensity + audioEnergy * 0.08;
    const lineWidth = 0.5 + rayIntensity * 1.5 * intensity * (0.8 + audioEnergy * 0.5);

    rays.push({ angle, length, opacity, width: lineWidth });
  }

  return (
    <AbsoluteFill>
      <svg width={width} height={height}>
        {rays.map((ray, i) => {
          const x2 = cx + Math.cos(ray.angle) * ray.length;
          const y2 = cy + Math.sin(ray.angle) * ray.length;

          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x2}
              y2={y2}
              stroke={hexToRgba(accentColor, ray.opacity)}
              strokeWidth={ray.width}
              strokeLinecap="round"
            />
          );
        })}

        {/* Center glow */}
        <circle
          cx={cx}
          cy={cy}
          r={10 + beatPulse * 15 * intensity}
          fill="none"
          stroke={hexToRgba(accentColor, 0.2 * intensity)}
          strokeWidth={2}
        />
      </svg>
    </AbsoluteFill>
  );
};
