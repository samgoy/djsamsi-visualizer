import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { useActivePhase } from '../hooks/phase-context';
import { hexToRgba } from '../utils/colors';

// Simplified "face" tile inspired by Alex Grey's Net of Being
// An abstract mandala: concentric ovals with radiating lines
const Tile: React.FC<{
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
  rotation: number;
}> = ({ x, y, size, opacity, color, rotation }) => {
  if (opacity < 0.01) return null;

  const r = size / 2;
  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${rotation})`}
      opacity={opacity}
    >
      {/* Outer oval */}
      <ellipse
        cx={0} cy={0}
        rx={r} ry={r * 1.3}
        fill="none"
        stroke={color}
        strokeWidth={0.8}
      />
      {/* Inner oval */}
      <ellipse
        cx={0} cy={0}
        rx={r * 0.5} ry={r * 0.7}
        fill="none"
        stroke={color}
        strokeWidth={0.6}
      />
      {/* Eye-like shape in center */}
      <ellipse
        cx={0} cy={0}
        rx={r * 0.25} ry={r * 0.15}
        fill={color}
        opacity={0.5}
      />
      {/* Radiating lines (4 directions) */}
      {[0, 90, 45, 135].map((angle) => (
        <line
          key={angle}
          x1={0} y1={0}
          x2={Math.cos((angle * Math.PI) / 180) * r * 0.9}
          y2={Math.sin((angle * Math.PI) / 180) * r * 1.2}
          stroke={color}
          strokeWidth={0.4}
          opacity={0.4}
        />
      ))}
    </g>
  );
};

export const NetOfBeingLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { intensity, beatPulse, accentColor, phase } = useActivePhase();

  // Only active near peak
  const visibility = interpolate(intensity, [0.5, 0.8, 1.0], [0, 0.15, 0.35], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  if (visibility < 0.01) return null;

  const tileSize = 80;
  const cols = Math.ceil(width / tileSize) + 2;
  const rows = Math.ceil(height / tileSize) + 2;
  const color = hexToRgba(accentColor, 0.6);

  const tiles: React.ReactNode[] = [];

  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const x = col * tileSize + (row % 2 === 0 ? 0 : tileSize / 2);
      const y = row * tileSize;

      // Wave modulation: tiles fade in/out in a wave pattern
      const wave = Math.sin(col * 0.4 + frame * 0.03) * Math.sin(row * 0.4 + frame * 0.025);
      const tileOpacity = visibility * (0.5 + wave * 0.5) + beatPulse * 0.05 * intensity;

      // Subtle rotation per tile
      const rot = Math.sin(col * 0.3 + row * 0.2 + frame * 0.01) * 5;

      tiles.push(
        <Tile
          key={`${row}-${col}`}
          x={x}
          y={y}
          size={tileSize * 0.8}
          opacity={Math.max(0, tileOpacity)}
          color={color}
          rotation={rot}
        />,
      );
    }
  }

  return (
    <AbsoluteFill>
      <svg width={width} height={height}>
        {tiles}
      </svg>
    </AbsoluteFill>
  );
};
