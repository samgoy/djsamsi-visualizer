import { DJSAMSI } from './brand';

export type PhaseId = 'arrival' | 'warmup' | 'peak' | 'cooldown' | 'silence';

export interface PhaseDefinition {
  id: PhaseId;
  startSec: number;
  endSec: number;
  bpm: number;
  intensity: number;
  color: string;
  accentColor: string;
}

// Phase timestamps — adjust these after recording the actual WAV
export const PHASES: PhaseDefinition[] = [
  {
    id: 'arrival',
    startSec: 0,
    endSec: 44,
    bpm: 65,
    intensity: 0.1,
    color: DJSAMSI.deepIndigo,
    accentColor: DJSAMSI.twilightPurple,
  },
  {
    id: 'warmup',
    startSec: 44,
    endSec: 111,
    bpm: 90,
    intensity: 0.5,
    color: DJSAMSI.twilightPurple,
    accentColor: DJSAMSI.forestTeal,
  },
  {
    id: 'peak',
    startSec: 111,
    endSec: 179,
    bpm: 118,
    intensity: 1.0,
    color: DJSAMSI.emberOrange,
    accentColor: DJSAMSI.sacredGold,
  },
  {
    id: 'cooldown',
    startSec: 179,
    endSec: 268,
    bpm: 75,
    intensity: 0.2,
    color: DJSAMSI.forestTeal,
    accentColor: DJSAMSI.twilightPurple,
  },
  {
    id: 'silence',
    startSec: 268,
    endSec: 290,
    bpm: 65,
    intensity: 0.0,
    color: DJSAMSI.deepIndigo,
    accentColor: DJSAMSI.deepIndigo,
  },
];

export const TOTAL_DURATION_SEC = 290;
export const FPS = 30;
export const TOTAL_FRAMES = TOTAL_DURATION_SEC * FPS;

// Transition window in seconds (blend zone between phases)
export const TRANSITION_SEC = 12;
