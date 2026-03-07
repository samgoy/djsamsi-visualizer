import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { useActivePhase } from '../hooks/phase-context';
import { flowerOfLifeCircles } from '../utils/geometry';
import { DJSAMSI } from '../brand';
import { lerpColor } from '../utils/colors';

const RADIUS = 120;
const circles = flowerOfLifeCircles(RADIUS);
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const SacredGeometryLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { intensity, beatPulse, phase, globalProgress, accentColor } = useActivePhase();

  // Slow rotation
  const rotation = frame * 0.05;

  // Draw-in during arrival: circles appear one by one
  const drawProgress = interpolate(frame, [0, fps * 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Opacity: visible during all phases, pulses with beat
  const baseOpacity = interpolate(intensity, [0, 0.1, 1], [0.1, 0.3, 0.7], {
    extrapolateRight: 'clamp',
  });
  const opacity = baseOpacity + beatPulse * 0.15 * intensity;

  // Color shifts with phase
  const strokeColor = lerpColor(DJSAMSI.twilightPurple, accentColor, intensity);

  // Scale breathing
  const breathe = 1 + Math.sin(frame * 0.02) * 0.02 * (1 + intensity);

  // During peak: slight fragmentation (circles offset outward)
  const fragmentAmount = phase === 'peak' ? intensity * 8 : 0;

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <svg
        width="800"
        height="800"
        viewBox="-400 -400 800 800"
        style={{
          opacity,
          transform: `rotate(${rotation}deg) scale(${breathe})`,
        }}
      >
        {circles.map((circle, i) => {
          // Stagger draw-in by ring
          const drawDelay = circle.ring * 0.25;
          const circleProgress = interpolate(
            drawProgress,
            [drawDelay, drawDelay + 0.3],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
          );

          // Fragment offset during peak
          const fragAngle = Math.atan2(circle.cy, circle.cx);
          const fragDist = fragmentAmount * (circle.ring / 2);
          const cx = circle.cx + Math.cos(fragAngle) * fragDist;
          const cy = circle.cy + Math.sin(fragAngle) * fragDist;

          // Individual pulse offset
          const pulseOffset = Math.sin(frame * 0.04 + i * 0.5) * 0.15;

          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={RADIUS}
              fill="none"
              stroke={strokeColor}
              strokeWidth={1.2 + intensity * 0.8}
              strokeOpacity={0.4 + pulseOffset + beatPulse * 0.2 * intensity}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - circleProgress)}
            />
          );
        })}

        {/* Center dot */}
        <circle
          cx={0}
          cy={0}
          r={3 + beatPulse * 2 * intensity}
          fill={accentColor}
          opacity={0.6 + beatPulse * 0.3}
        />
      </svg>
    </AbsoluteFill>
  );
};
