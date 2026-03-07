import React from 'react';
import { AbsoluteFill, Audio, staticFile } from 'remotion';
import { BackgroundLayer } from '../layers/BackgroundLayer';
import { NetOfBeingLayer } from '../layers/NetOfBeingLayer';
import { ToroidalFieldLayer } from '../layers/ToroidalFieldLayer';
import { ParticleLatticeLayer } from '../layers/ParticleLatticeLayer';
import { SacredGeometryLayer } from '../layers/SacredGeometryLayer';
import { EnergyRaysLayer } from '../layers/EnergyRaysLayer';
import { EyeOfSpiritLayer } from '../layers/EyeOfSpiritLayer';

export const EcstaticJourney: React.FC<{ audioFile?: string }> = ({
  audioFile,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#1a0a2e' }}>
      <BackgroundLayer />
      <NetOfBeingLayer />
      <ToroidalFieldLayer />
      <ParticleLatticeLayer />
      <SacredGeometryLayer />
      <EnergyRaysLayer />
      <EyeOfSpiritLayer />
      {audioFile && <Audio src={staticFile(audioFile)} volume={1} />}
    </AbsoluteFill>
  );
};
