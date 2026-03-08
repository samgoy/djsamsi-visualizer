import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { useConfigPhase, type PhaseInput } from '../hooks/useConfigPhase';
import { RenderSeedContext } from '../hooks/useRenderSeed';
import { PhaseContext } from '../hooks/phase-context';

// All available layers — import them all, render conditionally
import { BackgroundLayer } from '../layers/BackgroundLayer';
import { NetOfBeingLayer } from '../layers/NetOfBeingLayer';
import { ToroidalFieldLayer } from '../layers/ToroidalFieldLayer';
import { ParticleLatticeLayer } from '../layers/ParticleLatticeLayer';
import { SacredGeometryLayer } from '../layers/SacredGeometryLayer';
import { EnergyRaysLayer } from '../layers/EnergyRaysLayer';
import { EyeOfSpiritLayer } from '../layers/EyeOfSpiritLayer';
// Fractal layers — Tier 1
import { PhyllotaxisLayer } from '../layers/PhyllotaxisLayer';
import { FibonacciSpiralLayer } from '../layers/FibonacciSpiralLayer';
import { MetatronsCubeLayer } from '../layers/MetatronsCubeLayer';
// Audio-reactive + ambient layers — Tier 2
import { WaveformRingLayer } from '../layers/WaveformRingLayer';
import { NebulaLayer } from '../layers/NebulaLayer';
import { MandalaLayer } from '../layers/MandalaLayer';
// Immersive + psychedelic layers — Tier 3
import { FluidFlowLayer } from '../layers/FluidFlowLayer';
import { StrobePulseLayer } from '../layers/StrobePulseLayer';
import { ChakraRingsLayer } from '../layers/ChakraRingsLayer';
import { AuroraLayer } from '../layers/AuroraLayer';
import { KaleidoscopeLayer } from '../layers/KaleidoscopeLayer';

// Layer registry — maps layer name to component
const LAYER_REGISTRY: Record<string, React.FC> = {
  BackgroundLayer,
  NetOfBeingLayer,
  ToroidalFieldLayer,
  ParticleLatticeLayer,
  SacredGeometryLayer,
  EnergyRaysLayer,
  EyeOfSpiritLayer,
  // Fractal layers — Tier 1
  PhyllotaxisLayer,
  FibonacciSpiralLayer,
  MetatronsCubeLayer,
  // Audio-reactive + ambient layers — Tier 2
  WaveformRingLayer,
  NebulaLayer,
  MandalaLayer,
  // Immersive + psychedelic layers — Tier 3
  FluidFlowLayer,
  StrobePulseLayer,
  ChakraRingsLayer,
  AuroraLayer,
  KaleidoscopeLayer,
};

// Props passed from the engine via Remotion CLI --props
export interface ExperiencePlayerProps {
  phases: PhaseInput[];
  transitionSec: number;
  layers: string[];
  audioFile?: string;
  backgroundColor?: string;
  seed?: number;
  audioEnvelope?: number[];
  visualVariant?: {
    hueRotateDeg?: number;
    saturation?: number;
    contrast?: number;
    brightness?: number;
    cameraDrift?: number;
    vignetteOpacity?: number;
  };
}

export const ExperiencePlayer: React.FC<ExperiencePlayerProps> = ({
  phases,
  transitionSec,
  layers,
  audioFile,
  backgroundColor = '#1a0a2e',
  seed = 0,
  audioEnvelope = [],
  visualVariant = {},
}) => {
  const frame = useCurrentFrame();
  const phaseState = useConfigPhase(phases, transitionSec, audioEnvelope);

  const hash = (input: string): number => {
    let h = seed || 0;
    for (let i = 0; i < input.length; i++) {
      h = ((h << 5) - h + input.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  };

  const hueRotateDeg = visualVariant.hueRotateDeg ?? 0;
  const saturation = visualVariant.saturation ?? 1;
  const contrast = visualVariant.contrast ?? 1;
  const brightness = visualVariant.brightness ?? 1;
  const cameraDrift = visualVariant.cameraDrift ?? 0.006;
  const vignetteOpacity = visualVariant.vignetteOpacity ?? 0.18;
  const driftX = Math.sin(frame * 0.002 + seed * 0.01) * (cameraDrift * 100);
  const driftY = Math.cos(frame * 0.0016 + seed * 0.013) * (cameraDrift * 100);

  return (
    <RenderSeedContext.Provider value={seed}>
      <PhaseContext.Provider value={phaseState}>
        <AbsoluteFill style={{ backgroundColor, overflow: 'hidden' }}>
          <AbsoluteFill
            style={{
              transform: `translate(${driftX}px, ${driftY}px)`,
              filter: `hue-rotate(${hueRotateDeg}deg) saturate(${saturation}) contrast(${contrast}) brightness(${brightness})`,
            }}
          >
          {layers.map((layerName) => {
            const LayerComponent = LAYER_REGISTRY[layerName];
            if (!LayerComponent) {
              console.warn(`Unknown layer: ${layerName}`);
              return null;
            }

            const layerHash = hash(layerName);
            const opacity = 0.76 + (layerHash % 25) / 100;
            const scale = 1 + (layerHash % 5) / 400;
            const rotate = ((layerHash % 11) - 5) * 0.08;
            const modes = ['normal', 'screen', 'overlay', 'soft-light'] as const;
            const mixBlendMode = modes[layerHash % modes.length];

            return (
              <div
                key={layerName}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity,
                  transform: `scale(${scale}) rotate(${rotate}deg)`,
                  transformOrigin: '50% 50%',
                  mixBlendMode,
                }}
              >
                <LayerComponent />
              </div>
            );
          })}
          </AbsoluteFill>
          <AbsoluteFill
            style={{
              background: `radial-gradient(ellipse at 50% 50%, transparent 42%, rgba(3,6,12,${vignetteOpacity}) 100%)`,
            }}
          />
          {audioFile && <Audio src={staticFile(audioFile)} volume={1} />}
        </AbsoluteFill>
      </PhaseContext.Provider>
    </RenderSeedContext.Provider>
  );
};
