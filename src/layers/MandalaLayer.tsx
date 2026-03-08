import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { useActivePhase } from '../hooks/phase-context';
import { hexToRgba } from '../utils/colors';
import { useRenderSeed } from '../hooks/useRenderSeed';

// Rotating mandala — concentric rings of petals with N-fold symmetry.
// Detail increases with intensity. Rotates at BPM-linked speed.

export const MandalaLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { intensity, beatPulse, audioEnergy, accentColor, color } = useActivePhase();
  const seed = useRenderSeed();

  // Rotation speed tied loosely to energy
  const rotation = frame * (0.03 + intensity * 0.04);

  // N-fold symmetry: 6 at rest, up to 16 at peak
  const foldCount = Math.floor(6 + intensity * 10);

  // Number of concentric rings
  const ringCount = 2 + Math.floor(intensity * 3); // 2-5

  // Overall opacity
  const opacity = 0.15 + intensity * 0.45 + beatPulse * 0.1;

  // Breathing scale
  const breathe = 1 + Math.sin(frame * 0.018 + seed * 0.05) * 0.025 * (1 + intensity);

  const rings: React.ReactNode[] = [];

  for (let ring = 0; ring < ringCount; ring++) {
    const radius = 60 + ring * (50 + intensity * 20);
    const petalLen = 25 + ring * 15 + audioEnergy * 15;
    const petalWidth = 8 + ring * 3;
    const ringRotation = rotation * (ring % 2 === 0 ? 1 : -0.7) + ring * 15;
    const strokeAlpha = (0.2 + intensity * 0.4) / (1 + ring * 0.15);
    const strokeW = 1 + intensity * 0.8;

    // Use accent for inner rings, phase color for outer
    const ringColor = ring < ringCount / 2 ? accentColor : color;

    const petals: React.ReactNode[] = [];

    for (let i = 0; i < foldCount; i++) {
      const angle = (i / foldCount) * 360;

      // Diamond/petal shape as a rotated rhombus
      const ax = radius;
      const ay = 0;
      const bx = radius + petalLen;
      const by = -petalWidth / 2;
      const cx = radius + petalLen * 1.6;
      const cy = 0;
      const dx = radius + petalLen;
      const dy = petalWidth / 2;

      petals.push(
        <polygon
          key={`${ring}-${i}`}
          points={`${ax},${ay} ${bx},${by} ${cx},${cy} ${dx},${dy}`}
          fill="none"
          stroke={hexToRgba(ringColor, strokeAlpha)}
          strokeWidth={strokeW}
          transform={`rotate(${angle})`}
        />,
      );

      // Inner dot at each petal base — pulses with beat
      const dotR = 1.5 + beatPulse * 2 * intensity;
      petals.push(
        <circle
          key={`d${ring}-${i}`}
          cx={radius}
          cy={0}
          r={dotR}
          fill={hexToRgba(ringColor, strokeAlpha * 0.6)}
          transform={`rotate(${angle})`}
        />,
      );
    }

    rings.push(
      <g key={ring} transform={`rotate(${ringRotation})`}>
        {petals}
        {/* Connecting circle at this ring's radius */}
        <circle
          cx={0}
          cy={0}
          r={radius}
          fill="none"
          stroke={hexToRgba(ringColor, strokeAlpha * 0.3)}
          strokeWidth={0.5}
          strokeDasharray={`${4 + intensity * 4} ${8 + (1 - intensity) * 8}`}
        />
      </g>,
    );
  }

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <svg
        width="900"
        height="900"
        viewBox="-450 -450 900 900"
        style={{
          opacity,
          transform: `scale(${breathe})`,
        }}
      >
        {rings}
        {/* Center bindu (dot) */}
        <circle
          cx={0}
          cy={0}
          r={4 + beatPulse * 5 * intensity}
          fill={hexToRgba(accentColor, 0.5 + beatPulse * 0.4)}
        />
      </svg>
    </AbsoluteFill>
  );
};
