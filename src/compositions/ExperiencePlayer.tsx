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
// Generative art layers — Tier 4
import { SpectrumBarsLayer } from '../layers/SpectrumBarsLayer';
import { GridWarpLayer } from '../layers/GridWarpLayer';
import { ReactionDiffusionLayer } from '../layers/ReactionDiffusionLayer';
import { LissajousLayer } from '../layers/LissajousLayer';
import { VoronoiLayer } from '../layers/VoronoiLayer';
import { RibbonTrailLayer } from '../layers/RibbonTrailLayer';
import { FractalFlameLayer } from '../layers/FractalFlameLayer';
// Sacred geometry — Tier 5
import { YantraLayer } from '../layers/YantraLayer';

// Focus system
import { FocusContext, useComputeFocus } from '../hooks/useFocus';

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
  // Generative art layers — Tier 4
  SpectrumBarsLayer,
  GridWarpLayer,
  ReactionDiffusionLayer,
  LissajousLayer,
  VoronoiLayer,
  RibbonTrailLayer,
  FractalFlameLayer,
  // Sacred geometry — Tier 5
  YantraLayer,
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
  audioBands?: { bass: number[]; mid: number[]; treble: number[] };
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
  audioBands,
  visualVariant = {},
}) => {
  const frame = useCurrentFrame();
  const phaseState = useConfigPhase(phases, transitionSec, audioEnvelope, audioBands);
  const focusState = useComputeFocus(phaseState.intensity);

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

  // Beat flash: subtle brightness spike + scale pulse on beat impact
  const beatBrightness = brightness + (phaseState.beatImpact ?? 0) * 0.08;
  const beatScale = 1 + (phaseState.beatImpact ?? 0) * 0.003;

  return (
    <RenderSeedContext.Provider value={seed}>
      <FocusContext.Provider value={focusState}>
      <PhaseContext.Provider value={phaseState}>
        <AbsoluteFill style={{ backgroundColor, overflow: 'hidden' }}>
          <AbsoluteFill
            style={{
              transform: `translate(${driftX}px, ${driftY}px) scale(${beatScale})`,
              filter: `hue-rotate(${hueRotateDeg}deg) saturate(${saturation}) contrast(${contrast}) brightness(${beatBrightness})`,
            }}
          >
          {layers.map((layerName, layerIndex) => {
            const LayerComponent = LAYER_REGISTRY[layerName];
            if (!LayerComponent) {
              console.warn(`Unknown layer: ${layerName}`);
              return null;
            }

            const layerHash = hash(layerName);
            const baseOpacity = 0.76 + (layerHash % 25) / 100;
            const scale = 1 + (layerHash % 5) / 400;
            const rotate = ((layerHash % 11) - 5) * 0.08;
            const modes = ['normal', 'screen', 'overlay', 'soft-light'] as const;
            const mixBlendMode = modes[layerHash % modes.length];

            // Layer breathing: layers fade in based on intensity threshold
            const layerThreshold = layerIndex / Math.max(1, layers.length - 1);
            const fadeInStart = layerThreshold * 0.6;
            const fadeInEnd = fadeInStart + 0.3;
            const breatheOpacity = layerIndex === 0 ? 1
              : Math.max(0, Math.min(1, (phaseState.intensity - fadeInStart) / (fadeInEnd - fadeInStart)));
            const finalOpacity = baseOpacity * breatheOpacity;

            return (
              <div
                key={layerName}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: finalOpacity,
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
          {/* Watermark */}
          <div
            style={{
              position: 'absolute',
              bottom: 32,
              right: 40,
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 22,
              fontWeight: 400,
              color: '#d4a04a',
              opacity: 0.35,
              letterSpacing: '4px',
              textTransform: 'uppercase',
              textShadow: '0 0 12px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.6)',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            DJSamsi
          </div>
        </AbsoluteFill>
      </PhaseContext.Provider>
      </FocusContext.Provider>
    </RenderSeedContext.Provider>
  );
};
