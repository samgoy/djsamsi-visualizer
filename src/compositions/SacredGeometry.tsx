import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BackgroundLayer } from '../layers/BackgroundLayer';
import { SacredGeometryLayer } from '../layers/SacredGeometryLayer';

export const SacredGeometry: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#1a0a2e' }}>
      <BackgroundLayer />
      <SacredGeometryLayer />
    </AbsoluteFill>
  );
};
