import React from 'react';
import { Composition } from 'remotion';
import { EcstaticJourney } from './compositions/EcstaticJourney';
import { SacredGeometry } from './compositions/SacredGeometry';
import { ParticleLattice } from './compositions/ParticleLattice';
import { ExperiencePlayer, type ExperiencePlayerProps } from './compositions/ExperiencePlayer';
import { CodeJourney, type CodeJourneyProps } from './compositions/CodeJourney';
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

// Default props for CodeJourney (test with bell_garden genome)
const defaultCodeJourneyProps: CodeJourneyProps = {
  coverImage: 'test-cover.jpg',
  genome: {
    seed: 837324,
    worldType: 'bell_garden',
    tempo: 56.1,
    keyRoot: 5,
    scaleIndex: 0,
    melodyDensity: 0.158,
    rhythmDensity: 0.095,
    harmonicComplexity: 0.213,
    textureLevel: 0.601,
    ragaIndex: 0,
    rasaIndex: 0,
    durationSec: 120,
  },
  phases: [
    { id: 'arrival', start_sec: 0, end_sec: 20, intensity: 0.15, bpm: 56 },
    { id: 'building', start_sec: 20, end_sec: 50, intensity: 0.4, bpm: 58 },
    { id: 'peak', start_sec: 50, end_sec: 85, intensity: 0.8, bpm: 62 },
    { id: 'cooldown', start_sec: 85, end_sec: 110, intensity: 0.3, bpm: 56 },
    { id: 'silence', start_sec: 110, end_sec: 120, intensity: 0.05, bpm: 54 },
  ],
};

export const Root: React.FC = () => {
  return (
    <>
      {/* Code Journey — live synthesis code overlay on AI cover */}
      <Composition
        id="CodeJourney"
        component={CodeJourney as unknown as React.FC<Record<string, unknown>>}
        durationInFrames={FPS * 120}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={defaultCodeJourneyProps as unknown as Record<string, unknown>}
        calculateMetadata={({ props }) => {
          const p = props as unknown as CodeJourneyProps;
          return { durationInFrames: Math.ceil(p.genome.durationSec * FPS) };
        }}
      />
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
