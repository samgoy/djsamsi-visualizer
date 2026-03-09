import React, { useRef, useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { useActivePhase } from '../hooks/phase-context';
import { useRenderSeed } from '../hooks/useRenderSeed';

// Reaction-Diffusion — simplified Gray-Scott model producing Turing patterns.
// Creates organic, biological textures that morph with audio energy.
// Bass shifts feed/kill rates (pattern type), treble adds turbulence.

const SCALE = 4; // downscale factor for performance

export const ReactionDiffusionLayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<{ u: Float32Array; v: Float32Array } | null>(null);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { intensity, beatPulse, bassEnergy, trebleEnergy, accentColor } = useActivePhase();
  const seed = useRenderSeed();

  const gw = Math.floor(width / SCALE);
  const gh = Math.floor(height / SCALE);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize grid on first frame or size change
    if (!gridRef.current || gridRef.current.u.length !== gw * gh) {
      const u = new Float32Array(gw * gh).fill(1);
      const v = new Float32Array(gw * gh).fill(0);

      // Seed initial perturbations based on render seed
      const rng = (s: number) => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
      };
      let s = seed;
      const numSeeds = 5 + Math.floor(rng(seed * 7) * 8);
      for (let n = 0; n < numSeeds; n++) {
        s = (s * 9301 + 49297) % 233280;
        const cx = Math.floor(rng(s) * gw);
        s = (s * 9301 + 49297) % 233280;
        const cy = Math.floor(rng(s) * gh);
        const radius = 3 + Math.floor(rng(s * 3) * 5);
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            if (dx * dx + dy * dy <= radius * radius) {
              const x = (cx + dx + gw) % gw;
              const y = (cy + dy + gh) % gh;
              const idx = y * gw + x;
              u[idx] = 0.5;
              v[idx] = 0.25;
            }
          }
        }
      }
      gridRef.current = { u, v };
    }

    const { u, v } = gridRef.current;

    // Gray-Scott parameters modulated by audio
    // Bass shifts between spots (F=0.035,k=0.065) and stripes (F=0.04,k=0.06)
    const F = 0.035 + bassEnergy * 0.008;
    const k = 0.065 - bassEnergy * 0.005;
    const Du = 0.16;
    const Dv = 0.08;

    // Run simulation steps (more steps = faster evolution)
    const steps = 4 + Math.floor(intensity * 4);
    const uNext = new Float32Array(gw * gh);
    const vNext = new Float32Array(gw * gh);

    for (let step = 0; step < steps; step++) {
      for (let y = 0; y < gh; y++) {
        for (let x = 0; x < gw; x++) {
          const idx = y * gw + x;
          const uVal = u[idx];
          const vVal = v[idx];

          // Laplacian with wrapping
          const left = u[y * gw + ((x - 1 + gw) % gw)];
          const right = u[y * gw + ((x + 1) % gw)];
          const up = u[((y - 1 + gh) % gh) * gw + x];
          const down = u[((y + 1) % gh) * gw + x];
          const lapU = left + right + up + down - 4 * uVal;

          const vLeft = v[y * gw + ((x - 1 + gw) % gw)];
          const vRight = v[y * gw + ((x + 1) % gw)];
          const vUp = v[((y - 1 + gh) % gh) * gw + x];
          const vDown = v[((y + 1) % gh) * gw + x];
          const lapV = vLeft + vRight + vUp + vDown - 4 * vVal;

          const uvv = uVal * vVal * vVal;

          // Treble adds small random perturbation
          const noise = trebleEnergy > 0.3
            ? (Math.sin(x * 13.7 + y * 7.3 + frame * 0.1) * 0.001 * trebleEnergy)
            : 0;

          uNext[idx] = Math.max(0, Math.min(1,
            uVal + Du * lapU - uvv + F * (1 - uVal) + noise
          ));
          vNext[idx] = Math.max(0, Math.min(1,
            vVal + Dv * lapV + uvv - (F + k) * vVal
          ));
        }
      }
      // Copy back
      u.set(uNext);
      v.set(vNext);
    }

    // Render to canvas
    const r = parseInt(accentColor.slice(1, 3), 16);
    const g = parseInt(accentColor.slice(3, 5), 16);
    const b = parseInt(accentColor.slice(5, 7), 16);

    const imgData = ctx.createImageData(gw, gh);
    const data = imgData.data;

    for (let i = 0; i < gw * gh; i++) {
      const val = v[i];
      const bright = val * (0.6 + intensity * 0.4 + beatPulse * 0.15);
      const px = i * 4;
      data[px] = Math.min(255, r * bright);
      data[px + 1] = Math.min(255, g * bright);
      data[px + 2] = Math.min(255, b * bright);
      data[px + 3] = Math.min(255, bright * 200);
    }

    // Draw at reduced size then scale up
    ctx.clearRect(0, 0, width, height);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = gw;
    tempCanvas.height = gh;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(imgData, 0, 0);

    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(tempCanvas, 0, 0, width, height);
  }, [frame, width, height, gw, gh, intensity, beatPulse, bassEnergy, trebleEnergy, accentColor, seed]);

  return (
    <AbsoluteFill>
      <canvas ref={canvasRef} width={width} height={height} style={{ width: '100%', height: '100%' }} />
    </AbsoluteFill>
  );
};
