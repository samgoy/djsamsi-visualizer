import React, { useRef, useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { useActivePhase } from '../hooks/phase-context';
import { useRenderSeed } from '../hooks/useRenderSeed';

// Fractal Flame — Iterated Function System with nonlinear variations.
// Inspired by Apophysis / Electric Sheep. Each iteration applies random affine
// transforms + nonlinear warps (sinusoidal, swirl, horseshoe, etc.)
// Bass energy modulates swirl amount, treble shifts variation weights.

const ITERATIONS = 15000;
const SETTLE = 20; // discard first N iterations

// Nonlinear variation functions
type Variation = (x: number, y: number) => [number, number];

const variations: Variation[] = [
  // V0: Linear
  (x, y) => [x, y],
  // V1: Sinusoidal
  (x, y) => [Math.sin(x), Math.sin(y)],
  // V2: Spherical
  (x, y) => {
    const r2 = x * x + y * y + 1e-6;
    return [x / r2, y / r2];
  },
  // V3: Swirl
  (x, y) => {
    const r2 = x * x + y * y;
    return [
      x * Math.sin(r2) - y * Math.cos(r2),
      x * Math.cos(r2) + y * Math.sin(r2),
    ];
  },
  // V4: Horseshoe
  (x, y) => {
    const r = Math.sqrt(x * x + y * y) + 1e-6;
    return [(x - y) * (x + y) / r, 2 * x * y / r];
  },
  // V5: Polar
  (x, y) => {
    const r = Math.sqrt(x * x + y * y);
    const theta = Math.atan2(y, x);
    return [theta / Math.PI, r - 1];
  },
  // V6: Handkerchief
  (x, y) => {
    const r = Math.sqrt(x * x + y * y);
    const theta = Math.atan2(y, x);
    return [r * Math.sin(theta + r), r * Math.cos(theta - r)];
  },
];

export const FractalFlameLayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const phaseState = useActivePhase();
  const { intensity, beatPulse, bassEnergy, trebleEnergy, accentColor } = phaseState;
  const palette: string[] = 'palette' in phaseState ? (phaseState as any).palette : [];
  const seed = useRenderSeed();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Deterministic RNG from seed
    let rngState = seed * 1000 + 42;
    const rng = () => {
      rngState = (rngState * 1664525 + 1013904223) & 0xffffffff;
      return (rngState >>> 0) / 4294967296;
    };

    const time = frame * 0.01;

    // Generate 3-4 affine transforms
    const numTransforms = 3 + Math.floor(rng() * 2);
    const transforms: {
      a: number; b: number; c: number;
      d: number; e: number; f: number;
      variation: number;
      weight: number;
      color: number;
    }[] = [];

    for (let i = 0; i < numTransforms; i++) {
      // Slowly evolve transforms over time
      const tOff = i * 2.3 + time * 0.3;
      transforms.push({
        a: Math.sin(tOff) * 0.6 + rng() * 0.3,
        b: Math.cos(tOff * 0.7) * 0.5,
        c: Math.sin(tOff * 1.3) * 0.4 + bassEnergy * 0.2,
        d: Math.cos(tOff * 0.9) * 0.5,
        e: Math.sin(tOff * 0.5) * 0.6 + rng() * 0.3,
        f: Math.cos(tOff * 1.1) * 0.4,
        variation: Math.floor(rng() * variations.length),
        weight: 1 + rng(),
        color: i / numTransforms,
      });
    }

    // Bass modulates swirl variation weight
    const swirlIdx = 3; // swirl variation
    if (transforms[0]) {
      transforms[0].variation = swirlIdx;
      transforms[0].weight = 1 + bassEnergy * 2;
    }

    // Treble shifts which variations are active
    if (trebleEnergy > 0.4 && transforms.length > 1) {
      transforms[1].variation = Math.floor(trebleEnergy * variations.length) % variations.length;
    }

    // Normalize weights
    const totalWeight = transforms.reduce((s, t) => s + t.weight, 0);
    const cumWeights: number[] = [];
    let cum = 0;
    for (const t of transforms) {
      cum += t.weight / totalWeight;
      cumWeights.push(cum);
    }

    // Accumulation buffer
    const bufW = Math.floor(width / 2); // half res for performance
    const bufH = Math.floor(height / 2);
    const hitCount = new Float32Array(bufW * bufH);
    const colorBuf = new Float32Array(bufW * bufH);

    // Iterate the chaos game
    let px = rng() * 2 - 1;
    let py = rng() * 2 - 1;
    let pColor = rng();

    for (let iter = 0; iter < ITERATIONS; iter++) {
      // Choose transform by weight
      const roll = rng();
      let ti = 0;
      for (let i = 0; i < cumWeights.length; i++) {
        if (roll <= cumWeights[i]) {
          ti = i;
          break;
        }
      }

      const t = transforms[ti];

      // Apply affine transform
      const ax = t.a * px + t.b * py + t.c;
      const ay = t.d * px + t.e * py + t.f;

      // Apply nonlinear variation
      const [vx, vy] = variations[t.variation](ax, ay);
      px = vx;
      py = vy;
      pColor = (pColor + t.color) / 2;

      // Skip settle iterations
      if (iter < SETTLE) continue;

      // Clamp for safety
      if (!isFinite(px) || !isFinite(py)) {
        px = rng() * 2 - 1;
        py = rng() * 2 - 1;
        continue;
      }

      // Map to screen coordinates (centered, scaled)
      const scale = 0.3 + intensity * 0.15;
      const sx = Math.floor((px * scale + 0.5) * bufW);
      const sy = Math.floor((py * scale + 0.5) * bufH);

      if (sx >= 0 && sx < bufW && sy >= 0 && sy < bufH) {
        const idx = sy * bufW + sx;
        hitCount[idx]++;
        colorBuf[idx] = (colorBuf[idx] + pColor) / 2;
      }
    }

    // Find max hit for log-density mapping
    let maxHit = 1;
    for (let i = 0; i < hitCount.length; i++) {
      if (hitCount[i] > maxHit) maxHit = hitCount[i];
    }
    const logMax = Math.log(maxHit + 1);

    // Render to image — palette-driven multi-color flame
    const parseHex = (hex: string): [number, number, number] => [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];

    const pal = palette.length > 0 ? palette : [accentColor];
    const palRgb = pal.map(parseHex);

    const imgData = ctx.createImageData(bufW, bufH);
    const data = imgData.data;

    for (let i = 0; i < hitCount.length; i++) {
      if (hitCount[i] === 0) continue;

      // Log-density display (standard flame algorithm)
      const logDensity = Math.log(hitCount[i] + 1) / logMax;
      const bright = Math.pow(logDensity, 0.4) * (0.5 + intensity * 0.5 + beatPulse * 0.15);

      // Map colorBuf position to palette — interpolate between adjacent palette entries
      const c = colorBuf[i];
      const palPos = c * (palRgb.length - 1);
      const palIdx = Math.min(Math.floor(palPos), palRgb.length - 2);
      const palFrac = palPos - palIdx;
      const [r1, g1, b1] = palRgb[palIdx];
      const [r2, g2, b2] = palRgb[Math.min(palIdx + 1, palRgb.length - 1)];
      const r0 = r1 + (r2 - r1) * palFrac;
      const g0 = g1 + (g2 - g1) * palFrac;
      const b0 = b1 + (b2 - b1) * palFrac;

      const px4 = i * 4;
      data[px4] = Math.min(255, r0 * bright);
      data[px4 + 1] = Math.min(255, g0 * bright);
      data[px4 + 2] = Math.min(255, b0 * bright);
      data[px4 + 3] = Math.min(255, bright * 255);
    }

    // Scale up
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = bufW;
    tempCanvas.height = bufH;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(imgData, 0, 0);

    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(tempCanvas, 0, 0, width, height);
  }, [frame, width, height, intensity, beatPulse, bassEnergy, trebleEnergy, accentColor, seed, palette]);

  return (
    <AbsoluteFill>
      <canvas ref={canvasRef} width={width} height={height} style={{ width: '100%', height: '100%' }} />
    </AbsoluteFill>
  );
};
