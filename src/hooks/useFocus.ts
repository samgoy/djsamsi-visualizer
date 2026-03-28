import { createContext, useContext } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { createNoise } from '../utils/noise';
import { useRenderSeed } from './useRenderSeed';

export interface FocusState {
  /** Focal point x, normalized [0, 1] */
  x: number;
  /** Focal point y, normalized [0, 1] */
  y: number;
  /** Focus strength 0 = diffuse (everything equal), 1 = tight center-weighting */
  strength: number;
}

const DEFAULT_FOCUS: FocusState = { x: 0.5, y: 0.5, strength: 0 };

export const FocusContext = createContext<FocusState>(DEFAULT_FOCUS);

/** Consumer hook — layers call this to get current focus position and strength. */
export function useFocus(): FocusState {
  return useContext(FocusContext);
}

/**
 * Producer hook — called once in ExperiencePlayer to compute the focus point.
 * Uses simplex noise for smooth ~20s drift period, constrained to [0.25, 0.75].
 */
export function useComputeFocus(intensity: number): FocusState {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seed = useRenderSeed();
  const timeSec = frame / fps;

  // Use a dedicated noise seed so focus drift is independent of other visuals
  const noise = createNoise(seed + 9999);

  // Slow drift: ~20s period. noise3D with time on z-axis.
  const driftSpeed = 0.05; // lower = slower drift
  const nx = noise.noise3D(timeSec * driftSpeed, 0.0, seed * 0.17);
  const ny = noise.noise3D(0.0, timeSec * driftSpeed, seed * 0.31);

  // Map [-1, 1] noise to [0.25, 0.75] — never at extreme edges
  const x = 0.5 + nx * 0.25;
  const y = 0.5 + ny * 0.25;

  // Strength scales with intensity: low intensity = everything equal, high = focused
  const strength = intensity * 0.8;

  return { x, y, strength };
}

/**
 * Gaussian falloff from the focus point.
 * Returns [0, 1] where 1 = at the focus, 0 = far away.
 * When strength is low, returns values close to 1 for everything (diffuse).
 */
export function focusAttenuation(
  elemX: number,
  elemY: number,
  focusX: number,
  focusY: number,
  strength: number,
): number {
  if (strength < 0.01) return 1; // no focus = everything full

  const dx = elemX - focusX;
  const dy = elemY - focusY;
  const dist2 = dx * dx + dy * dy;

  // Sigma narrows with strength: 0.4 (wide) at strength=0 → 0.2 (tight) at strength=1
  const sigma = 0.4 - strength * 0.2;
  const gauss = Math.exp(-dist2 / (2 * sigma * sigma));

  // Blend: at low strength, mostly 1.0; at high strength, mostly gaussian
  return 1 - strength * (1 - gauss);
}
