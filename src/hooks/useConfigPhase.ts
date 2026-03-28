import { useCurrentFrame, useVideoConfig } from 'remotion';
import { lerpColor, generatePalette, getHue } from '../utils/colors';
import { gaussianSmooth, MAX_ENERGY, PRESENCE_THRESHOLD } from './useSmoothedAudio';

// Phase config passed from the engine via Remotion input props
export interface PhaseInput {
  id: string;
  start_sec: number;
  end_sec: number;
  bpm: number;
  intensity: number;
  color: string;       // hex color
  accent_color: string; // hex color
}

export interface ConfigPhaseState {
  phase: string;
  progress: number;
  globalProgress: number;
  intensity: number;
  bpm: number;
  color: string;
  accentColor: string;
  beatPulse: number;
  audioEnergy: number;
  bassEnergy: number;
  midEnergy: number;
  trebleEnergy: number;
  palette: string[];     // 3-5 harmonious colors derived from phase color
  isBeatHit: boolean;    // true on the frame nearest the beat peak
  beatImpact: number;    // 0-1 decay after beat hit (~6 frame decay)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

interface PhaseResult {
  current: PhaseInput;
  next: PhaseInput | null;
  blendT: number;
}

function findPhase(timeSec: number, phases: PhaseInput[], transitionSec: number): PhaseResult {
  for (let i = 0; i < phases.length; i++) {
    const p = phases[i];
    if (timeSec >= p.start_sec && timeSec < p.end_sec) {
      const next = i < phases.length - 1 ? phases[i + 1] : null;
      const transitionStart = p.end_sec - transitionSec;
      let blendT = 0;
      if (next && timeSec > transitionStart) {
        blendT = (timeSec - transitionStart) / transitionSec;
      }
      return { current: p, next, blendT };
    }
  }
  const last = phases[phases.length - 1];
  return { current: last, next: null, blendT: 0 };
}

export function useConfigPhase(
  phases: PhaseInput[],
  transitionSec: number = 12,
  audioEnvelope: number[] = [],
  audioBands?: { bass: number[]; mid: number[]; treble: number[] },
): ConfigPhaseState {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeSec = frame / fps;
  const totalDuration = phases[phases.length - 1].end_sec;

  const { current, next, blendT } = findPhase(timeSec, phases, transitionSec);
  const t = smoothstep(blendT);

  const progress = (timeSec - current.start_sec) / (current.end_sec - current.start_sec);
  const globalProgress = timeSec / totalDuration;

  const baseIntensity = next ? lerp(current.intensity, next.intensity, t) : current.intensity;
  const bpm = next ? lerp(current.bpm, next.bpm, t) : current.bpm;
  const color = next ? lerpColor(current.color, next.color, t) : current.color;
  const accentColor = next ? lerpColor(current.accent_color, next.accent_color, t) : current.accent_color;

  const beatFreq = bpm / 60;
  const beatPhase = (timeSec * beatFreq * Math.PI * 2) % (Math.PI * 2);
  const baseBeatPulse = (Math.sin(beatPhase) + 1) / 2;

  // ─── Smoothed Audio (gaussian-windowed, clamped to 0.7) ───
  // Uses windowed average instead of raw interpolation to prevent jitter.
  // When no audio data exists, falls back to BPM-derived pulse.
  const hasAudio = audioEnvelope.length > 0;
  const rawAudioEnergy = hasAudio ? gaussianSmooth(audioEnvelope, timeSec) : 0;

  // Audio presence: is there meaningful sound right now?
  const audioPresent = rawAudioEnergy > PRESENCE_THRESHOLD;

  // Smoothed frequency bands (gaussian-windowed, clamped to MAX_ENERGY=0.7)
  const bassEnergy = gaussianSmooth(audioBands?.bass ?? [], timeSec);
  const midEnergy = gaussianSmooth(audioBands?.mid ?? [], timeSec);
  const trebleEnergy = gaussianSmooth(audioBands?.treble ?? [], timeSec);

  // Stillness damping: reduce audio influence by ~70% when intensity is low
  const stillnessDamp = baseIntensity < 0.3
    ? 0.3 + (baseIntensity / 0.3) * 0.7
    : 1;
  const audioEnergy = rawAudioEnergy * stillnessDamp;

  // ─── Audio influences only 15-20% of core parameters (BPM stays primary) ───
  // beatPulse: 85% BPM-driven, 15% audio-enhanced
  const beatPulse = clamp01(baseBeatPulse * 0.85 + audioEnergy * 0.15);
  // intensity: 88% phase-driven, 12% audio-modulated
  const intensity = clamp01(baseIntensity * 0.88 + audioEnergy * 0.12);

  // Fallback: when audio is silent, base motion carries everything
  const _audioEnergy = audioPresent ? audioEnergy : baseBeatPulse * 0.1;

  // Beat hit detection — computable from cycle position alone (no frame-to-frame state)
  const beatCycleFrac = (beatPhase % (Math.PI * 2)) / (Math.PI * 2);
  const peakFrac = 0.25; // sine peaks at PI/2 = 25% of cycle
  const hitWindow = 0.04; // ~1-2 frames at typical BPM
  const isBeatHit = Math.abs(beatCycleFrac - peakFrac) < hitWindow;

  // Beat impact: fast decay after the peak
  const distFromPeak = ((beatCycleFrac - peakFrac) + 1) % 1;
  const decayWindow = 0.12;
  const beatImpact = distFromPeak < decayWindow
    ? Math.max(0, 1 - distFromPeak / decayWindow)
    : 0;

  // Palette: 3-5 harmonious colors from current phase color
  const palette = generatePalette(getHue(color), 'analogous', 0.65, 0.5);

  return {
    phase: blendT > 0.5 && next ? next.id : current.id,
    progress,
    globalProgress,
    intensity,
    bpm,
    color,
    accentColor,
    beatPulse,
    audioEnergy: _audioEnergy,
    bassEnergy: bassEnergy * stillnessDamp,
    midEnergy: midEnergy * stillnessDamp,
    trebleEnergy: trebleEnergy * stillnessDamp,
    palette,
    isBeatHit,
    beatImpact,
  };
}
