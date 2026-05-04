import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ─── Types ───────────────────────────────────────────────────────

export interface CodeJourneyProps {
  /** Path to AI cover image (staticFile or URL) */
  coverImage: string;
  /** Optional audio file path */
  audioFile?: string;
  /** Track genome data — the real synthesis parameters */
  genome: {
    seed: number;
    worldType: string;
    tempo: number;
    keyRoot: number;
    scaleIndex: number;
    melodyDensity: number;
    rhythmDensity: number;
    harmonicComplexity: number;
    textureLevel: number;
    ragaIndex: number;
    rasaIndex: number;
    durationSec: number;
  };
  /** Phase timeline */
  phases: {
    id: string;
    start_sec: number;
    end_sec: number;
    intensity: number;
    bpm: number;
    layers?: string[];
  }[];
  /** Audio envelope (0-1 per frame) for waveform visualization */
  audioEnvelope?: number[];
  /** Audio frequency bands per frame */
  audioBands?: {
    bass: number[];
    mid: number[];
    treble: number[];
  };
}

// ─── Constants ───────────────────────────────────────────────────

const KEY_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SCALE_NAMES = ['major', 'minor', 'dorian', 'mixolydian', 'pentatonic', 'harmonic_minor', 'phrygian'];
const RAGA_NAMES = ['Yaman', 'Bhairav', 'Todi', 'Marwa', 'Kafi', 'Bhairavi', 'Malkauns', 'Darbari', 'Bageshri'];
const RASA_NAMES = ['Shanta', 'Karuna', 'Veera', 'Adbhuta', 'Shringara', 'Bhakti'];

const INSTRUMENTS_BY_WORLD: Record<string, string[]> = {
  cosmic_dream: ['hollow_drone', 'evolving_pad', 'sine_lead', 'granular_cloud', 'binaural_theta'],
  forest_meditation: ['tanpura_drone', 'warm_pad', 'bansuri', 'wind_texture', 'birdsong'],
  ocean_drift: ['sine_drone', 'glass_pad', 'whale_song', 'ocean_noise', 'choir_pad'],
  crystal_nebula: ['fm_drone', 'evolving_pad', 'crystal', 'shimmer_texture', 'am_lead'],
  digital_machine: ['pulse_drone', 'wavetable_pad', 'fm_bell_lead', 'noise_perc', 'glitch'],
  tribal_pulse: ['tanpura_drone', 'dhol', 'sitar', 'fire_natural', 'bansuri'],
  liquid_galaxy: ['evolving_pad', 'glass_pad', 'round_bass', 'bright_pluck', 'shimmer_texture'],
  chakra_alignment: ['sine_drone', 'singing_bowl', 'om', 'warm_pad', 'chimes'],
  deep_rest: ['sine_drone', 'evolving_pad', 'binaural_delta', 'noise_lullaby'],
  pain_relief: ['warm_pad', 'sine_drone', 'choir_pad', 'wind_texture'],
  ecstatic_dance: ['pulse_drone', 'wavetable_pad', 'fm_bell_lead', 'euclidean_kick', 'shaker'],
  bell_garden: ['singing_bowl', 'chimes', 'warm_pad', 'kalimba', 'wind_texture'],
  rain_temple: ['sine_drone', 'rain_noise', 'singing_bowl', 'warm_pad', 'thunder_rumble'],
  tabla_trance: ['tanpura_drone', 'tabla_hit', 'sitar', 'bansuri', 'shaker'],
};

// Terminal color palette
const CODE_GREEN = '#4ade80';
const CODE_GOLD = '#d4a04a';
const CODE_BLUE = '#60a5fa';
const CODE_PURPLE = '#c084fc';
const CODE_PINK = '#f472b6';
const CODE_DIM = 'rgba(148, 163, 184, 0.6)';
const CODE_WHITE = '#e2e8f0';
const TERMINAL_BG = 'rgba(0, 0, 0, 0.88)';

// ─── Code Line Generator ─────────────────────────────────────────

interface CodeLine {
  text: string;
  color: string;
  indent: number;
  /** Time in seconds when this line appears */
  appearAt: number;
  /** Is this a comment line? */
  isComment?: boolean;
  /** Highlight (e.g. keyword) */
  highlight?: string;
}

function generateCodeLines(
  genome: CodeJourneyProps['genome'],
  phases: CodeJourneyProps['phases'],
): CodeLine[] {
  const lines: CodeLine[] = [];
  const key = KEY_NAMES[genome.keyRoot] || 'C';
  const scale = SCALE_NAMES[genome.scaleIndex] || 'minor';
  const raga = genome.ragaIndex >= 0 ? RAGA_NAMES[genome.ragaIndex] || 'Yaman' : null;
  const rasa = RASA_NAMES[genome.rasaIndex] || 'Shanta';
  const instruments = INSTRUMENTS_BY_WORLD[genome.worldType] || ['sine_drone', 'warm_pad'];
  const durationMin = Math.round(genome.durationSec / 60);

  // ── Seed initialization (appears at 0s)
  lines.push({ text: `// DJSamsi Generative Music Engine`, color: CODE_DIM, indent: 0, appearAt: 0, isComment: true });
  lines.push({ text: `const seed = ${genome.seed};`, color: CODE_GREEN, indent: 0, appearAt: 2 });
  lines.push({ text: `const world = "${genome.worldType}";`, color: CODE_GOLD, indent: 0, appearAt: 4 });
  lines.push({ text: '', color: CODE_WHITE, indent: 0, appearAt: 5 });

  // ── Genome unpacking (5-20s)
  lines.push({ text: `// Unpack genome from seed`, color: CODE_DIM, indent: 0, appearAt: 6, isComment: true });
  lines.push({ text: `const genome = seedToGenome(${genome.seed}, "${genome.worldType}");`, color: CODE_BLUE, indent: 0, appearAt: 8 });
  lines.push({ text: `genome.key = "${key}";`, color: CODE_WHITE, indent: 0, appearAt: 10 });
  lines.push({ text: `genome.scale = "${scale}";`, color: CODE_WHITE, indent: 0, appearAt: 11 });
  lines.push({ text: `genome.tempo = ${genome.tempo.toFixed(1)};  // BPM`, color: CODE_WHITE, indent: 0, appearAt: 12 });
  if (raga) {
    lines.push({ text: `genome.raga = "${raga}";  // Indian classical mode`, color: CODE_PINK, indent: 0, appearAt: 14 });
  }
  lines.push({ text: `genome.rasa = "${rasa}";  // emotional essence`, color: CODE_PURPLE, indent: 0, appearAt: 15 });
  lines.push({ text: `genome.melodyDensity = ${genome.melodyDensity.toFixed(3)};`, color: CODE_WHITE, indent: 0, appearAt: 17 });
  lines.push({ text: `genome.harmonicComplexity = ${genome.harmonicComplexity.toFixed(3)};`, color: CODE_WHITE, indent: 0, appearAt: 18 });
  lines.push({ text: `genome.rhythmDensity = ${genome.rhythmDensity.toFixed(3)};`, color: CODE_WHITE, indent: 0, appearAt: 19 });
  lines.push({ text: `genome.textureLevel = ${genome.textureLevel.toFixed(3)};`, color: CODE_WHITE, indent: 0, appearAt: 20 });
  lines.push({ text: '', color: CODE_WHITE, indent: 0, appearAt: 22 });

  // ── Instrument activation (appears at each phase start)
  lines.push({ text: `// Initialize audio pipeline — 44100Hz stereo`, color: CODE_DIM, indent: 0, appearAt: 24, isComment: true });
  lines.push({ text: `const buffer = new StereoBuffer(${durationMin} * 60 * 44100);`, color: CODE_BLUE, indent: 0, appearAt: 26 });
  lines.push({ text: '', color: CODE_WHITE, indent: 0, appearAt: 28 });

  // ── Instrument loading
  lines.push({ text: `// Load instrument palette`, color: CODE_DIM, indent: 0, appearAt: 30, isComment: true });
  instruments.forEach((inst, i) => {
    lines.push({
      text: `loadInstrument("${inst}");`,
      color: CODE_GREEN,
      indent: 0,
      appearAt: 32 + i * 2,
    });
  });
  lines.push({ text: '', color: CODE_WHITE, indent: 0, appearAt: 32 + instruments.length * 2 + 1 });

  // ── Phase rendering — synced to actual phase timestamps
  phases.forEach((phase, i) => {
    const phaseStart = phase.start_sec;
    const phaseLayers = phase.layers || instruments.slice(0, Math.min(3 + i, instruments.length));

    lines.push({
      text: `// ═══ Phase ${i + 1}: ${phase.id.toUpperCase()} ═══`,
      color: CODE_GOLD,
      indent: 0,
      appearAt: phaseStart,
      isComment: true,
    });
    lines.push({
      text: `renderPhase({`,
      color: CODE_BLUE,
      indent: 0,
      appearAt: phaseStart + 2,
    });
    lines.push({
      text: `id: "${phase.id}",`,
      color: CODE_WHITE,
      indent: 1,
      appearAt: phaseStart + 3,
    });
    lines.push({
      text: `bpm: ${phase.bpm.toFixed(1)},`,
      color: CODE_WHITE,
      indent: 1,
      appearAt: phaseStart + 4,
    });
    lines.push({
      text: `intensity: ${phase.intensity.toFixed(2)},`,
      color: phase.intensity > 0.7 ? CODE_PINK : CODE_WHITE,
      indent: 1,
      appearAt: phaseStart + 5,
    });

    // Show layer activations
    phaseLayers.forEach((layer, li) => {
      const volume = (0.2 + phase.intensity * 0.6).toFixed(2);
      lines.push({
        text: `${layer}: { volume: ${volume} },`,
        color: CODE_GREEN,
        indent: 1,
        appearAt: phaseStart + 7 + li * 2,
      });
    });

    lines.push({
      text: `});`,
      color: CODE_BLUE,
      indent: 0,
      appearAt: phaseStart + 7 + phaseLayers.length * 2 + 1,
    });
    lines.push({ text: '', color: CODE_WHITE, indent: 0, appearAt: phaseStart + 7 + phaseLayers.length * 2 + 2 });

    // DSP snippets at peak phases
    if (phase.intensity > 0.6) {
      lines.push({
        text: `// Apply low-pass filter sweep`,
        color: CODE_DIM,
        indent: 0,
        appearAt: phaseStart + 15,
        isComment: true,
      });
      lines.push({
        text: `const cutoff = ${(400 + phase.intensity * 1200).toFixed(0)} + 800 * sin(2π * 0.05 * t);`,
        color: CODE_PURPLE,
        indent: 0,
        appearAt: phaseStart + 17,
      });
      lines.push({
        text: `filter.setCutoff(cutoff);`,
        color: CODE_PURPLE,
        indent: 0,
        appearAt: phaseStart + 19,
      });
    }

    // Melody generation at moderate+ phases
    if (phase.intensity > 0.3 && genome.melodyDensity > 0.1) {
      const melodyInst = raga ? 'sitar' : 'kalimba';
      lines.push({
        text: `// Markov melody — ${raga ? `raga ${raga}` : `${scale} scale`}`,
        color: CODE_DIM,
        indent: 0,
        appearAt: phaseStart + 22,
        isComment: true,
      });
      lines.push({
        text: `melody.generate({ instrument: "${melodyInst}", key: "${key}" });`,
        color: CODE_PINK,
        indent: 0,
        appearAt: phaseStart + 24,
      });
    }
  });

  // ── Final render
  const lastPhase = phases[phases.length - 1];
  const endTime = lastPhase ? lastPhase.end_sec - 15 : genome.durationSec - 15;
  lines.push({ text: `// Finalize`, color: CODE_DIM, indent: 0, appearAt: endTime, isComment: true });
  lines.push({ text: `buffer.normalize(0.95);`, color: CODE_BLUE, indent: 0, appearAt: endTime + 2 });
  lines.push({ text: `writeWav(buffer, 44100);  // → ${durationMin}min stereo WAV`, color: CODE_GREEN, indent: 0, appearAt: endTime + 4 });

  return lines;
}

// ─── Sub-Components ──────────────────────────────────────────────

/** Typing cursor that blinks */
const Cursor: React.FC<{ visible: boolean }> = ({ visible }) => {
  const frame = useCurrentFrame();
  const blink = Math.floor(frame / 15) % 2 === 0;
  if (!visible || !blink) return null;
  return (
    <span style={{ color: CODE_GREEN, fontWeight: 'bold' }}>▌</span>
  );
};

/** Single code line with typewriter effect */
const TypedCodeLine: React.FC<{
  line: CodeLine;
  currentSec: number;
  isLatest: boolean;
}> = ({ line, currentSec, isLatest }) => {
  const elapsed = currentSec - line.appearAt;
  if (elapsed < 0) return null;

  // Typewriter: reveal characters over 0.8 seconds
  const typeDuration = 0.8;
  const revealFraction = Math.min(1, elapsed / typeDuration);
  const charsToShow = Math.floor(line.text.length * revealFraction);
  const displayText = line.text.slice(0, charsToShow);

  // Fade in opacity
  const opacity = Math.min(1, elapsed / 0.3);

  // Fade out old lines (lines older than 40s start fading)
  const age = elapsed;
  const fadeOut = age > 50 ? Math.max(0.1, 1 - (age - 50) / 20) : 1;

  const indent = line.indent * 24;

  return (
    <div
      style={{
        opacity: opacity * fadeOut,
        paddingLeft: indent,
        fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
        fontSize: 18,
        lineHeight: '28px',
        color: line.color,
        whiteSpace: 'pre',
        textShadow: line.isComment
          ? '0 1px 3px rgba(0,0,0,0.8)'
          : `0 0 10px ${line.color}50, 0 1px 3px rgba(0,0,0,0.9)`,
      }}
    >
      {displayText}
      {isLatest && revealFraction < 1 && <Cursor visible={true} />}
    </div>
  );
};

/** Waveform visualization bar */
const WaveformBar: React.FC<{
  audioEnvelope?: number[];
  audioBands?: { bass: number[]; mid: number[]; treble: number[] };
  frame: number;
  width: number;
}> = ({ audioEnvelope, audioBands, frame, width }) => {
  const barCount = 120;
  const barWidth = width / barCount - 2;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 30,
        left: 60,
        right: 60,
        height: 40,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 2,
      }}
    >
      {Array.from({ length: barCount }, (_, i) => {
        // Sample audio data or generate procedural waveform
        let height: number;
        if (audioBands) {
          const idx = Math.max(0, frame - barCount + i);
          const bass = audioBands.bass[idx] || 0;
          const mid = audioBands.mid[idx] || 0;
          const treble = audioBands.treble[idx] || 0;
          height = (bass * 0.5 + mid * 0.3 + treble * 0.2) * 35;
        } else if (audioEnvelope) {
          const idx = Math.max(0, frame - barCount + i);
          height = (audioEnvelope[idx] || 0) * 35;
        } else {
          // Procedural fallback — seeded noise
          const t = (frame - barCount + i) * 0.1;
          height = (Math.sin(t + i * 0.5) * 0.5 + 0.5) * 20 + Math.sin(t * 0.3 + i * 0.2) * 8;
        }
        height = Math.max(2, Math.min(35, height));

        return (
          <div
            key={i}
            style={{
              width: barWidth,
              height,
              backgroundColor: i > barCount * 0.8
                ? `rgba(212, 160, 74, ${0.3 + (height / 35) * 0.5})`  // gold for recent
                : `rgba(74, 222, 128, ${0.15 + (height / 35) * 0.3})`,  // green for older
              borderRadius: 1,
              transition: 'height 0.05s ease',
            }}
          />
        );
      })}
    </div>
  );
};

/** Phase indicator badge */
const PhaseIndicator: React.FC<{
  phases: CodeJourneyProps['phases'];
  currentSec: number;
}> = ({ phases, currentSec }) => {
  const current = phases.find(
    (p) => currentSec >= p.start_sec && currentSec < p.end_sec,
  );
  if (!current) return null;

  const progress = (currentSec - current.start_sec) / (current.end_sec - current.start_sec);

  return (
    <div
      style={{
        position: 'absolute',
        top: 40,
        right: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '12px 16px',
        borderRadius: 8,
      }}
    >
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 16,
          color: CODE_GOLD,
          opacity: 0.8,
          letterSpacing: 2,
          textTransform: 'uppercase',
          textShadow: `0 0 12px ${CODE_GOLD}80, 0 2px 6px rgba(0,0,0,0.9)`,
        }}
      >
        ▸ {current.id}
      </div>
      {/* Intensity meter */}
      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: CODE_DIM, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
          intensity
        </span>
        <div
          style={{
            width: 80,
            height: 4,
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${current.intensity * 100}%`,
              height: '100%',
              backgroundColor: current.intensity > 0.7 ? CODE_PINK : CODE_GREEN,
              borderRadius: 2,
            }}
          />
        </div>
      </div>
      {/* BPM */}
      <div style={{ fontFamily: 'monospace', fontSize: 12, color: CODE_DIM, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
        {current.bpm.toFixed(0)} BPM
      </div>
      {/* Phase progress bar */}
      <div
        style={{
          width: 80,
          height: 2,
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 1,
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            backgroundColor: CODE_GOLD,
            opacity: 0.5,
            borderRadius: 1,
          }}
        />
      </div>
    </div>
  );
};

// ─── Main Composition ────────────────────────────────────────────

export const CodeJourney: React.FC<CodeJourneyProps> = ({
  coverImage,
  audioFile,
  genome,
  phases,
  audioEnvelope,
  audioBands,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const currentSec = frame / fps;

  // Generate all code lines from genome + phases
  const codeLines = useMemo(
    () => generateCodeLines(genome, phases),
    [genome, phases],
  );

  // Get visible lines (appeared and not fully faded)
  const visibleLines = codeLines.filter(
    (line) => currentSec >= line.appearAt && currentSec - line.appearAt < 70,
  );

  // Find the latest line (for cursor placement)
  const latestLine = visibleLines.length > 0
    ? visibleLines.reduce((a, b) => (a.appearAt > b.appearAt ? a : b))
    : null;

  // Ken Burns: slow zoom + pan on cover image
  const zoomScale = interpolate(frame, [0, fps * genome.durationSec], [1, 1.15], {
    extrapolateRight: 'clamp',
  });
  const panX = Math.sin(frame * 0.0003) * 30;
  const panY = Math.cos(frame * 0.00025) * 20;

  // Terminal panel opacity — subtle pulse with intensity
  const currentPhase = phases.find(
    (p) => currentSec >= p.start_sec && currentSec < p.end_sec,
  );
  const terminalOpacity = currentPhase
    ? 0.7 + currentPhase.intensity * 0.15
    : 0.75;

  // Auto-scroll: keep latest lines in view
  const maxVisibleLines = 18;
  const displayLines = visibleLines.slice(-maxVisibleLines);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Layer 1: AI Cover with Ken Burns */}
      <AbsoluteFill>
        <Img
          src={staticFile(coverImage)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${zoomScale}) translate(${panX}px, ${panY}px)`,
          }}
        />
        {/* Darken overlay — heavier on left (code area) + bottom (waveform) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0.35) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 15%, rgba(0,0,0,0) 85%, rgba(0,0,0,0.4) 100%)',
          }}
        />
      </AbsoluteFill>

      {/* Layer 2: Code Terminal Overlay */}
      <div
        style={{
          position: 'absolute',
          left: 40,
          top: 80,
          width: 720,
          bottom: 100,
          backgroundColor: TERMINAL_BG,
          borderRadius: 12,
          border: '1px solid rgba(74, 222, 128, 0.15)',
          padding: '16px 20px',
          opacity: terminalOpacity,
          overflow: 'hidden',
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Terminal header bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
            paddingBottom: 8,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#eab308' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#22c55e' }} />
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 12,
              color: CODE_DIM,
              marginLeft: 12,
            }}
          >
            djsamsi-engine — seed:{genome.seed}
          </span>
        </div>

        {/* Code lines */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {displayLines.map((line, i) => (
            <TypedCodeLine
              key={`${line.appearAt}-${i}`}
              line={line}
              currentSec={currentSec}
              isLatest={line === latestLine}
            />
          ))}
        </div>
      </div>

      {/* Layer 3: Phase indicator */}
      <PhaseIndicator phases={phases} currentSec={currentSec} />

      {/* Layer 4: Waveform bar */}
      <WaveformBar
        audioEnvelope={audioEnvelope}
        audioBands={audioBands}
        frame={frame}
        width={width}
      />

      {/* Layer 5: Watermark */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          right: 50,
          fontFamily: 'Georgia, serif',
          fontSize: 22,
          color: CODE_GOLD,
          opacity: 0.45,
          textShadow: '0 0 8px rgba(0,0,0,0.9), 0 2px 6px rgba(0,0,0,0.8)',
        }}
      >
        DJSamsi
      </div>

      {/* Audio */}
      {audioFile && <Audio src={staticFile(audioFile)} />}
    </AbsoluteFill>
  );
};
