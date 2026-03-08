import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { useActivePhase } from '../hooks/phase-context';
import { hexToRgba } from '../utils/colors';

// Chakra rings — 7 colored energy centers stacked vertically.
// Each ring pulses independently, size/glow tied to audio energy.
// Creates a spine-like energy flow aligned with Indian spiritual tradition.

const CHAKRAS = [
  { name: 'root', color: '#ff0000', y: 0.85 },
  { name: 'sacral', color: '#ff7700', y: 0.73 },
  { name: 'solar', color: '#ffdd00', y: 0.61 },
  { name: 'heart', color: '#00cc44', y: 0.50 },
  { name: 'throat', color: '#0099ff', y: 0.39 },
  { name: 'third_eye', color: '#4400cc', y: 0.28 },
  { name: 'crown', color: '#9900ff', y: 0.17 },
];

export const ChakraRingsLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const { intensity, beatPulse, audioEnergy, globalProgress } = useActivePhase();

  // Flow energy rises from root to crown over time
  const flowPhase = (frame * 0.015) % (Math.PI * 2);

  const rings = CHAKRAS.map((chakra, i) => {
    // Individual pulse — wave flows upward through chakras
    const waveDelay = i * 0.9;
    const pulse = (Math.sin(flowPhase - waveDelay) + 1) / 2;

    // Base radius
    const baseR = 25 + i * 3; // slightly larger toward crown
    const r = baseR + pulse * 15 * intensity + beatPulse * 8 * intensity;

    // Opacity: all visible but the one "activated" by the wave is brighter
    const baseAlpha = 0.15 + intensity * 0.2;
    const activeAlpha = baseAlpha + pulse * 0.3 * intensity + audioEnergy * 0.1;

    // Glow radius
    const glowR = r * (1.8 + pulse * 1.5 * intensity);

    // Rotation per chakra
    const rot = frame * (0.3 + i * 0.1) * (i % 2 === 0 ? 1 : -1);

    // Petal count: increases upward (4 root → 1000 crown, simplified to 4→12)
    const petalCount = 4 + i * 1.3;
    const intPetals = Math.floor(petalCount);

    return (
      <g key={i}>
        {/* Outer glow */}
        <circle
          cx="50%"
          cy={`${chakra.y * 100}%`}
          r={glowR}
          fill="none"
          stroke={hexToRgba(chakra.color, activeAlpha * 0.15)}
          strokeWidth={glowR * 0.3}
        />

        {/* Main ring */}
        <circle
          cx="50%"
          cy={`${chakra.y * 100}%`}
          r={r}
          fill="none"
          stroke={hexToRgba(chakra.color, activeAlpha)}
          strokeWidth={1.5 + intensity}
        />

        {/* Spinning petals */}
        {Array.from({ length: intPetals }).map((_, p) => {
          const angle = (p / intPetals) * 360 + rot;
          const rad = (angle * Math.PI) / 180;
          const petalLen = r * 0.6;
          const px = petalLen * Math.cos(rad);
          const py = petalLen * Math.sin(rad);
          // Using percent-based coords: offset from center
          return (
            <line
              key={p}
              x1="960"
              y1={chakra.y * 1080}
              x2={960 + px}
              y2={chakra.y * 1080 + py}
              stroke={hexToRgba(chakra.color, activeAlpha * 0.5)}
              strokeWidth={1}
              strokeLinecap="round"
            />
          );
        })}

        {/* Center dot */}
        <circle
          cx="960"
          cy={chakra.y * 1080}
          r={3 + pulse * 4 * intensity}
          fill={hexToRgba(chakra.color, 0.4 + pulse * 0.5)}
        />
      </g>
    );
  });

  // Connecting spine line
  const spineAlpha = 0.08 + intensity * 0.12;

  return (
    <AbsoluteFill>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080">
        {/* Spine line */}
        <line
          x1="960"
          y1={CHAKRAS[0].y * 1080}
          x2="960"
          y2={CHAKRAS[6].y * 1080}
          stroke={hexToRgba('#ffffff', spineAlpha)}
          strokeWidth={1}
          strokeDasharray="4 8"
        />
        {rings}
      </svg>
    </AbsoluteFill>
  );
};
