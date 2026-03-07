import React from 'react';
import { AbsoluteFill } from 'remotion';
import { useActivePhase } from '../hooks/phase-context';
import { hexToRgba } from '../utils/colors';
import { DJSAMSI } from '../brand';
import { useRenderSeed } from '../hooks/useRenderSeed';
import { useCurrentFrame } from 'remotion';

export const BackgroundLayer: React.FC = () => {
  const { color, accentColor, intensity, audioEnergy } = useActivePhase();
  const seed = useRenderSeed();
  const frame = useCurrentFrame();
  const ox = 50 + Math.sin(frame * 0.0012 + seed * 0.07) * 12;
  const oy = 50 + Math.cos(frame * 0.0016 + seed * 0.05) * 10;

  return (
    <AbsoluteFill>
      {/* Base gradient */}
      <div
        style={{
          width: '100%',
          height: '100%',
          background: `radial-gradient(ellipse at ${ox}% ${oy}%, ${color} 0%, ${DJSAMSI.deepIndigo} 100%)`,
        }}
      />
      {/* Accent glow in center — intensity driven */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `radial-gradient(circle at ${100 - ox}% ${100 - oy}%, ${hexToRgba(accentColor, 0.12 + 0.22 * intensity + 0.12 * audioEnergy)} 0%, transparent 60%)`,
        }}
      />
      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `radial-gradient(ellipse at 50% 50%, transparent 40%, ${hexToRgba(DJSAMSI.deepIndigo, 0.7)} 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
