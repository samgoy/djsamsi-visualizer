import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BackgroundLayer } from '../layers/BackgroundLayer';
import { ParticleLatticeLayer } from '../layers/ParticleLatticeLayer';

export const ParticleLattice: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#1a0a2e' }}>
      <BackgroundLayer />
      <ParticleLatticeLayer />
    </AbsoluteFill>
  );
};
