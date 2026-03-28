import { useVideoConfig, useCurrentFrame } from 'remotion';

/**
 * Deterministic audio smoothing for Remotion (no frame-to-frame state).
 *
 * Uses gaussian-windowed averaging over the audio time series so that
 * every frame computes the exact same value regardless of render order.
 * This mimics an exponential moving average (EMA) with alpha ~0.1 but
 * works perfectly with Remotion's parallel frame rendering.
 */

export interface SmoothedAudio {
  energy: number;     // overall smoothed audio energy [0, MAX]
  bass: number;       // smoothed bass band [0, MAX]
  mid: number;        // smoothed mid band [0, MAX]
  treble: number;     // smoothed treble band [0, MAX]
  presence: boolean;  // true if audio is meaningfully active
}

// ─── Configuration ───────────────────────────────────────
const SMOOTHING_SIGMA = 0.6;       // gaussian sigma in seconds (~0.22s half-life equivalent)
const WINDOW_RADIUS = 1.5;         // look ±1.5s around current time
const MAX_ENERGY = 0.7;            // hard clamp ceiling for all values
const PRESENCE_THRESHOLD = 0.05;   // below this, audio is "silent"
const STILLNESS_INTENSITY = 0.3;   // below this intensity, dampen audio
const STILLNESS_DAMPEN = 0.3;      // keep only 30% of audio influence in stillness

// ─── Windowed Gaussian Average ───────────────────────────
// For a given time t, computes a weighted average of nearby samples
// using a gaussian kernel. Samples closer to t weigh more.
function gaussianSmooth(arr: number[], timeSec: number): number {
  if (arr.length === 0) return 0;

  const startIdx = Math.max(0, Math.floor(timeSec - WINDOW_RADIUS));
  const endIdx = Math.min(arr.length - 1, Math.ceil(timeSec + WINDOW_RADIUS));

  let sum = 0;
  let weightSum = 0;
  const sigmaSquared2 = 2 * SMOOTHING_SIGMA * SMOOTHING_SIGMA;

  for (let i = startIdx; i <= endIdx; i++) {
    const dist = i - timeSec;
    const weight = Math.exp(-(dist * dist) / sigmaSquared2);
    sum += (arr[i] || 0) * weight;
    weightSum += weight;
  }

  return weightSum > 0 ? Math.min(sum / weightSum, MAX_ENERGY) : 0;
}

// ─── Hook ────────────────────────────────────────────────
export function useSmoothedAudio(
  audioEnvelope: number[],
  audioBands: { bass: number[]; mid: number[]; treble: number[] } | undefined,
  intensity: number,
): SmoothedAudio {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeSec = frame / fps;

  // Smooth each band independently
  const rawEnergy = gaussianSmooth(audioEnvelope, timeSec);
  const rawBass = gaussianSmooth(audioBands?.bass ?? [], timeSec);
  const rawMid = gaussianSmooth(audioBands?.mid ?? [], timeSec);
  const rawTreble = gaussianSmooth(audioBands?.treble ?? [], timeSec);

  // Stillness damping: when intensity is low, reduce audio influence by ~70%
  const dampFactor = intensity < STILLNESS_INTENSITY
    ? STILLNESS_DAMPEN + (intensity / STILLNESS_INTENSITY) * (1 - STILLNESS_DAMPEN)
    : 1;

  const energy = rawEnergy * dampFactor;
  const bass = rawBass * dampFactor;
  const mid = rawMid * dampFactor;
  const treble = rawTreble * dampFactor;

  // Audio presence: is there meaningful audio right now?
  const presence = rawEnergy > PRESENCE_THRESHOLD;

  return { energy, bass, mid, treble, presence };
}

// Re-export for direct use in useConfigPhase without the hook wrapper
export { gaussianSmooth, MAX_ENERGY, PRESENCE_THRESHOLD };
