import { useCurrentFrame, useVideoConfig } from 'remotion';
import { PHASES, TRANSITION_SEC, type PhaseId, type PhaseDefinition } from '../journey';
import { lerpColor } from '../utils/colors';

export interface PhaseState {
  phase: PhaseId;
  progress: number;        // 0-1 within current phase
  globalProgress: number;  // 0-1 across entire journey
  intensity: number;       // 0-1, smoothly interpolated energy level
  bpm: number;             // interpolated BPM
  color: string;           // interpolated background color
  accentColor: string;     // interpolated accent color
  beatPulse: number;       // 0-1, pulses at current BPM (for syncing visuals to beat)
  audioEnergy: number;     // fallback: same as beatPulse in static mode
  bassEnergy: number;      // 0-1, low frequency energy (20-250Hz)
  midEnergy: number;       // 0-1, mid frequency energy (250-4000Hz)
  trebleEnergy: number;    // 0-1, high frequency energy (4000-16000Hz)
}

function findPhase(timeSec: number): { current: PhaseDefinition; next: PhaseDefinition | null; blendT: number } {
  for (let i = 0; i < PHASES.length; i++) {
    const p = PHASES[i];
    if (timeSec >= p.startSec && timeSec < p.endSec) {
      const next = i < PHASES.length - 1 ? PHASES[i + 1] : null;
      // Check if we're in the transition zone (last TRANSITION_SEC of this phase)
      const transitionStart = p.endSec - TRANSITION_SEC;
      let blendT = 0;
      if (next && timeSec > transitionStart) {
        blendT = (timeSec - transitionStart) / TRANSITION_SEC;
      }
      return { current: p, next, blendT };
    }
  }
  // Default to last phase
  const last = PHASES[PHASES.length - 1];
  return { current: last, next: null, blendT: 0 };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Smooth easing for transitions
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

export function usePhase(): PhaseState {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeSec = frame / fps;
  const totalDuration = PHASES[PHASES.length - 1].endSec;

  const { current, next, blendT } = findPhase(timeSec);
  const t = smoothstep(blendT);

  const progress = (timeSec - current.startSec) / (current.endSec - current.startSec);
  const globalProgress = timeSec / totalDuration;

  const intensity = next
    ? lerp(current.intensity, next.intensity, t)
    : current.intensity;

  const bpm = next
    ? lerp(current.bpm, next.bpm, t)
    : current.bpm;

  const color = next
    ? lerpColor(current.color, next.color, t)
    : current.color;

  const accentColor = next
    ? lerpColor(current.accentColor, next.accentColor, t)
    : current.accentColor;

  // Beat pulse: a value that oscillates 0→1→0 at the current BPM
  const beatFreq = bpm / 60; // beats per second
  const beatPhase = (timeSec * beatFreq * Math.PI * 2) % (Math.PI * 2);
  const beatPulse = (Math.sin(beatPhase) + 1) / 2;

  return {
    phase: blendT > 0.5 && next ? next.id : current.id,
    progress,
    globalProgress,
    intensity,
    bpm,
    color,
    accentColor,
    beatPulse,
    audioEnergy: beatPulse,
    bassEnergy: beatPulse,
    midEnergy: beatPulse,
    trebleEnergy: beatPulse,
  };
}
