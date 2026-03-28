import React from 'react';
import { Composition } from 'remotion';
import { EcstaticJourney } from './compositions/EcstaticJourney';
import { SacredGeometry } from './compositions/SacredGeometry';
import { ParticleLattice } from './compositions/ParticleLattice';
import { ExperiencePlayer, type ExperiencePlayerProps } from './compositions/ExperiencePlayer';
import { TOTAL_FRAMES, FPS, PHASES, TRANSITION_SEC } from './journey';
import { DJSAMSI } from './brand';

// Default props for ExperiencePlayer (maps the original EcstaticJourney config)
const defaultExperienceProps: ExperiencePlayerProps = {
  phases: PHASES.map((p) => ({
    id: p.id,
    start_sec: p.startSec,
    end_sec: p.endSec,
    bpm: p.bpm,
    intensity: p.intensity,
    color: p.color,
    accent_color: p.accentColor,
  })),
  transitionSec: TRANSITION_SEC,
  layers: [
    'BackgroundLayer',
    'NetOfBeingLayer',
    'ToroidalFieldLayer',
    'ParticleLatticeLayer',
    'SacredGeometryLayer',
    'EnergyRaysLayer',
    'EyeOfSpiritLayer',
  ],
  audioFile: 'audio/full-journey.wav',
  backgroundColor: DJSAMSI.deepIndigo,
};

export const Root: React.FC = () => {
  return (
    <>
      {/* Original hardcoded composition (preserved for backward compatibility) */}
      <Composition
        id="EcstaticJourney"
        component={EcstaticJourney}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          audioFile: 'audio/full-journey.wav',
        }}
      />
      {/* Config-driven composition — the engine renders this one
           Cast through unknown required by Remotion v4 generic Composition<Schema, Props> */}
      <Composition
        id="ExperiencePlayer"
        component={ExperiencePlayer as unknown as React.FC<Record<string, unknown>>}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={defaultExperienceProps as unknown as Record<string, unknown>}
        calculateMetadata={({ props }) => {
          const p = props as unknown as ExperiencePlayerProps;
          const lastPhase = p.phases[p.phases.length - 1];
          if (lastPhase) {
            const totalSec = lastPhase.end_sec;
            return { durationInFrames: Math.ceil(totalSec * FPS) };
          }
          return {};
        }}
      />
      <Composition
        id="SacredGeometry"
        component={SacredGeometry}
        durationInFrames={FPS * 30}
        fps={FPS}
        width={1080}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="ParticleLattice"
        component={ParticleLattice}
        durationInFrames={FPS * 30}
        fps={FPS}
        width={1080}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};
