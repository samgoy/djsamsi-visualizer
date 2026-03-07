// Deterministic seeded pseudo-random number generator
// Critical: Remotion renders frames out of order — must be deterministic

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Get a deterministic random value for a given particle and frame
export function seededRandom(
  particleIndex: number,
  frame: number,
  channel: number = 0,
  globalSeed: number = 0,
): number {
  const seed = particleIndex * 7919 + frame * 6271 + channel * 3571 + globalSeed * 1013;
  return mulberry32(seed)();
}

// Get a stable random value for a particle (doesn't change per frame)
export function stableRandom(
  particleIndex: number,
  channel: number = 0,
  globalSeed: number = 0,
): number {
  const seed = particleIndex * 7919 + channel * 3571 + globalSeed * 1013;
  return mulberry32(seed)();
}

export interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  speed: number;
}

// Generate grid-based particle positions
export function generateParticleGrid(
  count: number,
  width: number,
  height: number,
  frame: number,
  breatheAmplitude: number,
  globalSeed: number = 0,
): Particle[] {
  const cols = Math.ceil(Math.sqrt(count * (width / height)));
  const rows = Math.ceil(count / cols);
  const spacingX = width / (cols + 1);
  const spacingY = height / (rows + 1);

  const particles: Particle[] = [];

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const idx = i * cols + j;
      if (idx >= count) break;

      const baseX = (j + 1) * spacingX;
      const baseY = (i + 1) * spacingY;
      const speed = 0.5 + stableRandom(idx, 0, globalSeed) * 1.5;
      const phaseOffset = stableRandom(idx, 1, globalSeed) * Math.PI * 2;

      const breatheX = Math.sin(frame * 0.03 * speed + phaseOffset) * breatheAmplitude;
      const breatheY = Math.cos(frame * 0.025 * speed + phaseOffset + 1.5) * breatheAmplitude;

      particles.push({
        x: baseX + breatheX,
        y: baseY + breatheY,
        baseX,
        baseY,
        size: 1.5 + stableRandom(idx, 2, globalSeed) * 2,
        speed,
      });
    }
  }

  return particles;
}

// Find connections between nearby particles
export function findConnections(
  particles: Particle[],
  maxDistance: number,
): Array<[number, number, number]> {
  const connections: Array<[number, number, number]> = []; // [indexA, indexB, distance]

  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < maxDistance) {
        connections.push([i, j, dist]);
      }
    }
  }

  return connections;
}
