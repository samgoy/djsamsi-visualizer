import { createNoise } from './noise';

const PHI = 1.618033988749895;
const DEFAULT_FREQUENCIES = [1, 1 / PHI, 1 / (PHI * PHI), 1 / (PHI * PHI * PHI)];

/**
 * Sum of sine waves at golden-ratio-spaced frequencies.
 * Produces organic, non-repeating oscillation in [-1, 1].
 */
export function layeredOscillation(
  time: number,
  seed: number,
  frequencies: number[] = DEFAULT_FREQUENCIES,
): number {
  let sum = 0;
  let ampTotal = 0;
  let amp = 1;

  for (let i = 0; i < frequencies.length; i++) {
    const phase = seed * (i + 1) * 0.7137; // offset per harmonic
    sum += amp * Math.sin(time * frequencies[i] * Math.PI * 2 + phase);
    ampTotal += amp;
    amp *= 0.618; // golden ratio amplitude decay
  }

  return sum / ampTotal;
}

// Cache noise instances by seed to avoid re-creating permutation tables
const noiseCache = new Map<number, ReturnType<typeof createNoise>>();
function getNoise(seed: number) {
  let n = noiseCache.get(seed);
  if (!n) {
    n = createNoise(seed);
    // Keep cache bounded
    if (noiseCache.size > 64) noiseCache.clear();
    noiseCache.set(seed, n);
  }
  return n;
}

/**
 * Simplex noise-based smooth random walk. Returns [-1, 1].
 * Uses noise3D with time as z-axis for animation.
 */
export function organicDrift(
  time: number,
  seed: number,
  speed: number = 1,
): number {
  const noise = getNoise(seed);
  return noise.noise3D(time * speed * 0.1, seed * 0.31, time * speed * 0.07);
}

/**
 * Asymmetric breathing cycle: inhale(40%) → hold(10%) → exhale(40%) → hold(10%).
 * Returns [0, 1] where 1 = lungs full, 0 = lungs empty.
 */
export function breathe(time: number, period: number = 8): number {
  const t = ((time % period) + period) % period / period; // normalized 0-1 cycle position

  // Phase boundaries
  const inhaleEnd = 0.4;
  const holdFullEnd = 0.5;
  const exhaleEnd = 0.9;
  // holdEmpty: 0.9 - 1.0

  if (t < inhaleEnd) {
    // Inhale: ease in-out from 0 to 1
    return smoothstep(t / inhaleEnd);
  } else if (t < holdFullEnd) {
    // Hold full
    return 1;
  } else if (t < exhaleEnd) {
    // Exhale: ease in-out from 1 to 0
    return 1 - smoothstep((t - holdFullEnd) / (exhaleEnd - holdFullEnd));
  } else {
    // Hold empty
    return 0;
  }
}

function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}
