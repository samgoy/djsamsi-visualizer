import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { useActivePhase } from '../hooks/phase-context';
import { DJSAMSI } from '../brand';
import { hexToRgba } from '../utils/colors';

export const EyeOfSpiritLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { intensity, beatPulse, accentColor, globalProgress } = useActivePhase();

  // Eye openness: 0 = closed, 1 = fully open
  const openness = interpolate(
    globalProgress,
    [0, 0.15, 0.38, 0.62, 0.85, 1.0],
    [0, 0.1,  0.6,  1.0,  0.3,  0.0],
    { extrapolateRight: 'clamp' },
  );

  if (openness < 0.01) return null;

  const eyeWidth = 160;
  const eyeHeight = 70 * openness;

  // Iris size pulses with beat
  const irisRadius = 28 + beatPulse * 4 * intensity;
  // Pupil contracts at high intensity (more light = smaller pupil)
  const pupilRadius = interpolate(intensity, [0, 1], [14, 6]);
  // Subtle iris rotation
  const irisRotation = frame * 0.3;

  // Breathing scale
  const breathe = 1 + Math.sin(frame * 0.025) * 0.015;

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <svg
        width="400"
        height="300"
        viewBox="-200 -150 400 300"
        style={{
          opacity: 0.5 + intensity * 0.4,
          transform: `scale(${breathe})`,
        }}
      >
        <defs>
          {/* Iris gradient */}
          <radialGradient id="iris-grad">
            <stop offset="0%" stopColor={DJSAMSI.sacredGold} />
            <stop offset="40%" stopColor={accentColor} />
            <stop offset="100%" stopColor={DJSAMSI.deepIndigo} />
          </radialGradient>

          {/* Eye glow */}
          <radialGradient id="eye-glow">
            <stop offset="0%" stopColor={hexToRgba(DJSAMSI.sacredGold, 0.3 * intensity)} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Outer glow */}
        <ellipse
          cx={0}
          cy={0}
          rx={eyeWidth + 40}
          ry={eyeHeight + 40}
          fill="url(#eye-glow)"
        />

        {/* Eye shape (two bezier curves forming an almond) */}
        <path
          d={`
            M ${-eyeWidth} 0
            Q 0 ${-eyeHeight * 2} ${eyeWidth} 0
            Q 0 ${eyeHeight * 2} ${-eyeWidth} 0
            Z
          `}
          fill={DJSAMSI.deepIndigo}
          stroke={hexToRgba(accentColor, 0.4 + beatPulse * 0.3)}
          strokeWidth={1.5}
        />

        {/* Iris */}
        <g transform={`rotate(${irisRotation})`}>
          <circle
            cx={0}
            cy={0}
            r={irisRadius}
            fill="url(#iris-grad)"
          />
          {/* Iris detail lines — radiating spokes */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            const inner = pupilRadius + 2;
            const outer = irisRadius - 2;
            return (
              <line
                key={i}
                x1={Math.cos(angle) * inner}
                y1={Math.sin(angle) * inner}
                x2={Math.cos(angle) * outer}
                y2={Math.sin(angle) * outer}
                stroke={hexToRgba(DJSAMSI.sacredGold, 0.3)}
                strokeWidth={0.8}
              />
            );
          })}
        </g>

        {/* Pupil */}
        <circle
          cx={0}
          cy={0}
          r={pupilRadius}
          fill="#000000"
        />

        {/* Pupil light reflection */}
        <circle
          cx={pupilRadius * 0.3}
          cy={-pupilRadius * 0.3}
          r={pupilRadius * 0.25}
          fill={hexToRgba(DJSAMSI.smokeWhite, 0.4)}
        />
      </svg>
    </AbsoluteFill>
  );
};
