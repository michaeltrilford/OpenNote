import type { InstrumentName } from './instrument.js';
import type {
  BackingControls,
  GenerationMode,
  GateStyle,
  GrowthStyle,
  MetronomeMode,
  ModRate,
  ModTarget,
  PitchRange,
  TimingFeel,
} from './arrangement.js';
import type { DecayStyle, FxPresetName } from './fx.js';
import type { ProviderName } from './providers/factory.js';

export type RuntimeMode = 'desktop' | 'web';

export type CliConfig = {
  runtime: RuntimeMode;
  provider: ProviderName;
  providerAuth: 'none' | 'env' | 'session';
  source: 'generated' | 'record';
  mode: GenerationMode;
  instrument: InstrumentName;
  fxPreset: FxPresetName;
  decayStyle: DecayStyle;
  transpose: number;
  pitchRange: PitchRange;
  snapScale: boolean;
  modRate: ModRate;
  modDepth: number;
  modTarget: ModTarget;
  growthStyle: GrowthStyle;
  durationStretch: number;
  timingFeel: TimingFeel;
  timingAmount: number;
  backing: BackingControls;
  theme: string;
  length: number;
  bpm: number;
  seedPitch: number;
  seedSource: 'manual' | 'keyboard';
  beep: boolean;
  openAfterExport: 'none' | 'finder' | 'garageband';
  exportAudio: 'none' | 'wav' | 'mp3' | 'mp4';
  exportStems: boolean;
  eqMode: 'balanced' | 'flat' | 'warm' | 'bright' | 'bass' | 'phone';
  recordDevice: string;
  recordSeconds: number;
  recordMonitor: boolean;
  recordProfile: 'default' | 'vinyl' | 'dust';
  recordFamily: 'character' | 'motion' | 'space' | 'bug';
  recordBugMode: 'off' | 'pll-drift' | 'buffer-tear' | 'clock-bleed' | 'memory-rot' | 'crc-glitch';
  recordIntensity: number;
  recordChaos: number;
  recordMix: number;
  recordScratch: 'off' | 'texture' | 'dj';
  recordWavy: number;
};

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function fgHex(hex: string): string {
  const clean = hex.replace('#', '');
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  return `\x1b[38;2;${r};${g};${b}m`;
}

const palette = {
  primary: fgHex('#d199ff'),
  soft: fgHex('#ecebff'),
};

function color(text: string, code: string): string {
  return `${code}${text}${c.reset}`;
}

function asPositiveInt(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function asMidiPitch(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(127, parsed));
}

function asBoundedInt(value: string, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

type Option<T> = {
  value: T;
  label: string;
  help?: string;
};

type SelectPromptFn = (cfg: any) => Promise<any>;
type InputPromptFn = (cfg: any) => Promise<string>;
type PasswordPromptFn = (cfg: any) => Promise<string>;
type SetupPath = 'basic' | 'surprise' | 'advanced';
type SurpriseStrength = 'low' | 'medium' | 'wild';

function isWebRuntime(runtime: RuntimeMode): boolean {
  return runtime === 'web';
}

function clampOpenAfterExportForRuntime(
  runtime: RuntimeMode,
  value: 'none' | 'finder' | 'garageband',
): 'none' | 'finder' | 'garageband' {
  return isWebRuntime(runtime) ? 'none' : value;
}

function clampExportAudioForRuntime(
  runtime: RuntimeMode,
  value: 'none' | 'wav' | 'mp3' | 'mp4',
): 'none' | 'wav' | 'mp3' | 'mp4' {
  if (isWebRuntime(runtime)) return value === 'none' ? 'none' : 'wav';
  return value;
}

function getOpenAfterExportOptions(runtime: RuntimeMode): Option<'none' | 'finder' | 'garageband'>[] {
  return isWebRuntime(runtime)
    ? OPEN_AFTER_EXPORT_OPTIONS.filter((option) => option.value === 'none')
    : OPEN_AFTER_EXPORT_OPTIONS;
}

function getExportAudioOptions(
  runtime: RuntimeMode,
  source: 'generated' | 'record',
): Option<'none' | 'wav' | 'mp3' | 'mp4'>[] {
  const options = source === 'record' ? EXPORT_AUDIO_RECORD_OPTIONS : EXPORT_AUDIO_OPTIONS;
  return isWebRuntime(runtime)
    ? options.filter((option) => option.value === 'none' || option.value === 'wav')
    : options;
}

const inquirerTheme = {
  icon: {
    cursor: '❯',
  },
  style: {
    highlight: (text: string) => color(text, palette.primary),
    message: (text: string) => color(text, `${c.bold}${palette.soft}`),
    description: (text: string) => color(text, `${c.dim}${palette.soft}`),
    answer: (text: string) => color(text, palette.primary),
    defaultAnswer: (text: string) => color(text, `${c.dim}${palette.soft}`),
    help: (text: string) => color(text, `${c.dim}${palette.soft}`),
    key: (text: string) => color(text, palette.primary),
    error: (text: string) => color(text, c.red),
  },
};

const THEME_OPTIONS: Option<string>[] = [
  { value: 'ambient cinematic', label: 'Chill      Ambient', help: 'Slow, atmospheric, spacious tones.' },
  { value: 'lofi chillhop', label: 'Chill      Lo-fi', help: 'Warm, mellow, relaxed melodic movement.' },
  { value: 'minimal techno groove', label: 'Electronic Techno', help: 'Repetitive, driving, club-like phrasing.' },
  { value: 'melodic house uplifting', label: 'Electronic House', help: 'Steady and emotive dance melodies.' },
  { value: 'synthwave retro neon', label: 'Electronic Synthwave', help: '80s-inspired arps and nostalgic hooks.' },
  { value: 'trap melodic lead', label: 'Modern     Trap', help: 'Modern, sparse, hook-focused movement.' },
  { value: 'jazz neo-soul phrasing', label: 'Organic    Jazz / Neo Soul', help: 'Colorful, expressive note choices.' },
  { value: 'cinematic suspense score', label: 'Score      Cinematic', help: 'Dramatic, soundtrack-style motifs.' },
  { value: 'dark industrial pulse', label: 'Score      Industrial', help: 'Tense, gritty, mechanical feel.' },
  { value: '__custom__', label: 'Custom', help: 'Type your own style prompt.' },
];

const LENGTH_OPTIONS: Option<number>[] = [
  { value: 8, label: 'Short (8 notes)' },
  { value: 16, label: 'Medium (16 notes)' },
  { value: 32, label: 'Long (32 notes)' },
  { value: -1, label: 'Custom' },
];

const BPM_OPTIONS: Option<number>[] = [
  { value: 90, label: 'Chill (90 BPM)' },
  { value: 110, label: 'Groove (110 BPM)' },
  { value: 120, label: 'Standard (120 BPM)' },
  { value: 128, label: 'Club (128 BPM)' },
  { value: -1, label: 'Custom' },
];

const SEED_SOURCE_OPTIONS: Option<'manual' | 'keyboard'>[] = [
  { value: 'keyboard', label: 'Keyboard test mode (1-8 keys)', help: 'Use computer keyboard to pick seed note.' },
  { value: 'manual', label: 'Manual MIDI pitch value', help: 'Type pitch number directly (0-127).' },
];

const OPEN_AFTER_EXPORT_OPTIONS: Option<'none' | 'finder' | 'garageband'>[] = [
  { value: 'none', label: 'Do nothing', help: 'Keep control in CLI only.' },
  { value: 'finder', label: 'Reveal in Finder', help: 'Open Finder and highlight exported MIDI.' },
  { value: 'garageband', label: 'Open in GarageBand', help: 'Launch GarageBand with exported MIDI.' },
];

const EXPORT_AUDIO_OPTIONS: Option<'none' | 'wav' | 'mp3' | 'mp4'>[] = [
  { value: 'mp4', label: 'MIDI + MP4', help: 'Render video with static cover image + audio.' },
  { value: 'mp3', label: 'MIDI + MP3', help: 'Render audio from generated notes.' },
  { value: 'wav', label: 'MIDI + WAV', help: 'Render playable WAV audio without ffmpeg.' },
  { value: 'none', label: 'MIDI only (.mid)', help: 'No extra audio/video export.' },
];

const EXPORT_AUDIO_RECORD_OPTIONS: Option<'none' | 'wav' | 'mp3' | 'mp4'>[] = [
  { value: 'mp4', label: 'MIDI + MP4', help: 'Render video with record-player character FX.' },
  { value: 'mp3', label: 'MIDI + MP3', help: 'Render audio with record-player character FX.' },
  { value: 'wav', label: 'MIDI + WAV', help: 'Render playable WAV audio with record-player character FX.' },
  { value: 'none', label: 'MIDI only (.mid)', help: 'No extra audio/video export.' },
];

const INSTRUMENT_OPTIONS: Option<InstrumentName>[] = [
  { value: 'lead', label: 'Lead', help: 'Higher melodic line.' },
  { value: 'bass', label: 'Bass', help: 'Lower-end groove line.' },
  { value: 'pad', label: 'Pad', help: 'Smoother, wider note range.' },
  { value: 'keys', label: 'Keys', help: 'Mid register keyboard tone.' },
  { value: 'drums', label: 'Drums', help: 'Maps notes to drum hits (channel 10).' },
];

const FX_PRESET_OPTIONS: Option<FxPresetName>[] = [
  { value: 'clean', label: 'Clean', help: 'Minimal coloration.' },
  { value: 'dark', label: 'Dark', help: 'Darker tone with mild grit.' },
  { value: 'grime', label: 'Grime', help: 'Heavy drive + crunch.' },
  { value: 'lush', label: 'Lush', help: 'Wider, wetter ambience.' },
  { value: 'punch', label: 'Punch', help: 'Tighter attack and impact.' },
];

const DECAY_OPTIONS: Option<DecayStyle>[] = [
  { value: 'tight', label: 'Tight', help: 'Shorter decay, plucky feel.' },
  { value: 'balanced', label: 'Balanced', help: 'Default decay.' },
  { value: 'long', label: 'Long', help: 'Extended tail/sustain.' },
];

const MODE_OPTIONS: Option<GenerationMode>[] = [
  { value: 'single', label: 'Single Track', help: 'Current flow, melody only.' },
  { value: 'backing', label: 'AI Backing', help: 'Reveal drums/bass/groove controls.' },
];

const SOURCE_OPTIONS: Option<'generated' | 'record'>[] = [
  { value: 'generated', label: 'Generate', help: 'Default flow: generate MIDI notes (melody + optional backing).'},
  { value: 'record', label: 'Record Player', help: 'Generate notes, then render with record-player FX controls.' },
];

const RECORD_PROFILE_OPTIONS: Option<'default' | 'vinyl' | 'dust'>[] = [
  { value: 'default', label: 'Default', help: 'Cleanest render with no extra record color.' },
  { value: 'vinyl', label: 'Vinyl', help: 'Warm deck tone with gentle saturation.' },
  { value: 'dust', label: 'Dust', help: 'Darker lo-fi texture with grit.' },
];

const EQ_MODE_OPTIONS: Option<'balanced' | 'flat' | 'warm' | 'bright' | 'bass' | 'phone'>[] = [
  { value: 'balanced', label: 'Balanced', help: 'General-purpose leveling and tone balance.' },
  { value: 'flat', label: 'Flat', help: 'Minimal tonal shaping.' },
  { value: 'warm', label: 'Warm', help: 'Softer highs with fuller low-mids.' },
  { value: 'bright', label: 'Bright', help: 'Extra top-end clarity.' },
  { value: 'bass', label: 'Bass Boost', help: 'Low-end emphasis for heavier vibe.' },
  { value: 'phone', label: 'Phone / Radio', help: 'Narrow band-limited texture.' },
];

const RECORD_FAMILY_OPTIONS: Option<'character' | 'motion' | 'space' | 'bug'>[] = [
  { value: 'character', label: 'Character', help: 'Tone color and saturation.' },
  { value: 'motion', label: 'Motion', help: 'Time movement and wobble behavior.' },
  { value: 'space', label: 'Space', help: 'Echo and room-style width.' },
  { value: 'bug', label: 'Bug Mode', help: 'Intentional unstable/glitch character.' },
];

const BUG_MODE_OPTIONS: Option<'off' | 'pll-drift' | 'buffer-tear' | 'clock-bleed' | 'memory-rot' | 'crc-glitch'>[] = [
  { value: 'off', label: 'Off', help: 'No bug modulation.' },
  { value: 'pll-drift', label: 'PLL Drift', help: 'Pitch hunts around center lock.' },
  { value: 'buffer-tear', label: 'Buffer Tear', help: 'Micro pull/tear movement.' },
  { value: 'clock-bleed', label: 'Clock Bleed', help: 'Aliased digital grit.' },
  { value: 'memory-rot', label: 'Memory Rot', help: 'Decaying lo-fi loss.' },
  { value: 'crc-glitch', label: 'CRC Glitch', help: 'Sharp error-like gating.' },
];

const SETUP_PATH_OPTIONS: Option<SetupPath>[] = [
  { value: 'basic', label: 'Basic', help: 'Fast setup using default pitch/mod/backing values.' },
  { value: 'surprise', label: 'Surprise me', help: 'Auto-pick presets and controls from your style.' },
  { value: 'advanced', label: 'Advanced', help: 'Full control over pitch, modulation, and groove.' },
];

const SURPRISE_STRENGTH_OPTIONS: Option<SurpriseStrength>[] = [
  { value: 'low', label: 'Low', help: 'Safer combinations, subtle variation.' },
  { value: 'medium', label: 'Medium', help: 'Balanced novelty and musical stability.' },
  { value: 'wild', label: 'Wild', help: 'Higher-risk, stronger character jumps.' },
];

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function rangeInt(min: number, max: number): number {
  if (max <= min) return min;
  return min + Math.floor(Math.random() * (max - min + 1));
}

function strengthChance(strength: SurpriseStrength, low: number, medium: number, wild: number): boolean {
  const p = strength === 'low' ? low : strength === 'medium' ? medium : wild;
  return Math.random() < p;
}

function surprisePreset(runtime: RuntimeMode, theme: string, strength: SurpriseStrength): {
  source: 'generated' | 'record';
  mode: GenerationMode;
  instrument: InstrumentName;
  eqMode: 'balanced' | 'flat' | 'warm' | 'bright' | 'bass' | 'phone';
  fxPreset: FxPresetName;
  decayStyle: DecayStyle;
  transpose: number;
  pitchRange: PitchRange;
  snapScale: boolean;
  modRate: ModRate;
  modDepth: number;
  modTarget: ModTarget;
  growthStyle: GrowthStyle;
  durationStretch: number;
  timingFeel: TimingFeel;
  timingAmount: number;
  backing: BackingControls;
  recordProfile: 'default' | 'vinyl' | 'dust';
  recordFamily: 'character' | 'motion' | 'space' | 'bug';
  recordBugMode: 'off' | 'pll-drift' | 'buffer-tear' | 'clock-bleed' | 'memory-rot' | 'crc-glitch';
  recordIntensity: number;
  recordChaos: number;
  recordMix: number;
  recordScratch: 'off' | 'texture' | 'dj';
  recordWavy: number;
  openAfterExport: 'none' | 'finder' | 'garageband';
  exportAudio: 'none' | 'wav' | 'mp3' | 'mp4';
  exportStems: boolean;
  length: number;
  bpm: number;
  seedPitch: number;
  rationale: string;
} {
  const t = theme.toLowerCase();
  const isAmbient = t.includes('ambient') || t.includes('cinematic');
  const isTrap = t.includes('trap');
  const isTech = t.includes('techno') || t.includes('house') || t.includes('industrial');
  const source: 'generated' | 'record' = isAmbient
    ? (strengthChance(strength, 0.2, 0.4, 0.6) ? 'record' : 'generated')
    : strengthChance(strength, 0.18, 0.35, 0.5) ? 'record' : 'generated';
  const mode: GenerationMode = isAmbient
    ? 'single'
    : strengthChance(strength, 0.45, 0.6, 0.72) ? 'backing' : 'single';
  const instrument = isAmbient
    ? pickOne<InstrumentName>(['pad', 'keys', 'lead'])
    : isTrap
      ? pickOne<InstrumentName>(['lead', 'bass', 'keys'])
      : isTech
        ? pickOne<InstrumentName>(['lead', 'keys', 'bass'])
        : pickOne<InstrumentName>(['lead', 'keys', 'pad', 'bass']);
  const fxPreset = isAmbient
    ? pickOne<FxPresetName>(['lush', 'dark', 'clean'])
    : isTrap
      ? pickOne<FxPresetName>(['grime', 'punch', 'dark'])
      : isTech
      ? pickOne<FxPresetName>(['punch', 'dark', 'grime'])
      : pickOne<FxPresetName>(['clean', 'dark', 'punch', 'lush']);
  const decayStyle = isAmbient
    ? pickOne<DecayStyle>(['long', 'balanced'])
    : isTrap
      ? pickOne<DecayStyle>(['tight', 'balanced'])
      : pickOne<DecayStyle>(['balanced', 'tight', 'long']);
  const eqMode = isAmbient
    ? pickOne<'balanced' | 'flat' | 'warm' | 'bright' | 'bass' | 'phone'>(['balanced', 'warm', 'flat'])
    : isTrap
      ? pickOne<'balanced' | 'flat' | 'warm' | 'bright' | 'bass' | 'phone'>(['bass', 'balanced', 'warm'])
      : isTech
        ? pickOne<'balanced' | 'flat' | 'warm' | 'bright' | 'bass' | 'phone'>(['balanced', 'bright', 'phone'])
        : pickOne<'balanced' | 'flat' | 'warm' | 'bright' | 'bass' | 'phone'>(['balanced', 'warm', 'bright', 'flat']);

  const transpose = rangeInt(-5, 5);
  const pitchRange = instrument === 'bass'
    ? 'low'
    : instrument === 'pad'
      ? pickOne<PitchRange>(['mid', 'high'])
      : pickOne<PitchRange>(['low', 'mid', 'high']);
  const snapScale = strengthChance(strength, isTrap ? 0.45 : 0.8, isTrap ? 0.5 : 0.72, isTrap ? 0.55 : 0.62);
  const modRate = pickOne<ModRate>(['off', 'slow', 'med', 'fast']);
  const modDepth = modRate === 'off' ? 0 : (
    strength === 'low' ? rangeInt(6, 30) : strength === 'medium' ? rangeInt(10, 54) : rangeInt(14, 72)
  );
  const modTarget = pickOne<ModTarget>(['velocity', 'duration', 'pitch']);
  const growthStyle: GrowthStyle = strengthChance(strength, 0.55, 0.65, 0.72) ? 'build' : 'flat';
  const durationStretch = pickOne([1, 1.25, 1.5, 2]);
  const timingFeel = pickOne<TimingFeel>(['tight', 'human', 'offbeat', 'loose']);
  const timingAmount = timingFeel === 'tight'
    ? 0
    : strength === 'low' ? rangeInt(6, 26) : strength === 'medium' ? rangeInt(10, 44) : rangeInt(16, 62);

  const backing: BackingControls = mode === 'backing'
    ? {
        drums: true,
        bass: strengthChance(strength, 0.55, 0.72, 0.85),
        clap: strengthChance(strength, 0.42, 0.56, 0.72),
        openHat: strengthChance(strength, 0.35, 0.55, 0.7),
        perc: strengthChance(strength, 0.25, 0.45, 0.62),
        metronome: strengthChance(strength, 0.45, 0.35, 0.2) ? 'count-in' : 'off',
        swing: isTech ? rangeInt(2, strength === 'wild' ? 30 : 22) : rangeInt(0, strength === 'wild' ? 22 : 14),
        gate: pickOne<GateStyle>(['tight', 'balanced', 'long']),
        mutate: strength === 'low' ? rangeInt(0, 14) : strength === 'medium' ? rangeInt(4, 24) : rangeInt(8, 40),
        deviate: strength === 'low' ? rangeInt(0, 12) : strength === 'medium' ? rangeInt(4, 20) : rangeInt(8, 32),
      }
    : {
        drums: false,
        bass: false,
        clap: false,
        openHat: false,
        perc: false,
        metronome: 'off',
        swing: 0,
        gate: 'balanced',
        mutate: 0,
        deviate: 0,
      };

  const recordProfile: 'default' | 'vinyl' | 'dust' = pickOne(['default', 'vinyl', 'dust']);
  const recordFamily: 'character' | 'motion' | 'space' | 'bug' = source === 'record'
    ? (strength === 'low' ? pickOne(['character', 'motion', 'space']) : pickOne(['character', 'motion', 'space', 'bug']))
    : 'bug';
  const recordBugMode: 'off' | 'pll-drift' | 'buffer-tear' | 'clock-bleed' | 'memory-rot' | 'crc-glitch' =
    recordFamily === 'bug'
      ? (strength === 'low'
        ? pickOne(['pll-drift', 'buffer-tear'])
        : strength === 'medium'
          ? pickOne(['pll-drift', 'buffer-tear', 'clock-bleed', 'memory-rot'])
          : pickOne(['pll-drift', 'buffer-tear', 'clock-bleed', 'memory-rot', 'crc-glitch']))
      : 'off';

  const recordIntensity = recordFamily === 'bug'
    ? (strength === 'low' ? rangeInt(18, 44) : strength === 'medium' ? rangeInt(30, 62) : rangeInt(45, 84))
    : (source === 'record' ? rangeInt(20, 58) : 0);
  const recordMix = recordFamily === 'bug'
    ? (strength === 'low' ? rangeInt(18, 42) : strength === 'medium' ? rangeInt(26, 56) : rangeInt(34, 70))
    : (source === 'record' ? rangeInt(20, 50) : 0);
  const recordChaos = recordFamily === 'bug'
    ? (strength === 'low' ? rangeInt(10, 32) : strength === 'medium' ? rangeInt(16, 46) : rangeInt(24, 72))
    : (source === 'record' ? rangeInt(8, 36) : 0);
  const recordScratch: 'off' | 'texture' | 'dj' = source === 'record'
    ? (strength === 'low' ? pickOne(['off', 'texture']) : pickOne(['off', 'texture', 'dj']))
    : 'off';
  const recordWavy = source === 'record'
    ? (strength === 'low' ? rangeInt(8, 34) : strength === 'medium' ? rangeInt(14, 52) : rangeInt(24, 72))
    : 0;

  const length = surpriseLength();
  const bpm = surpriseBpm(theme);
  const seedPitch = surpriseSeed();
  const exportAudio: 'none' | 'wav' | 'mp3' | 'mp4' = clampExportAudioForRuntime(runtime, 'mp4');
  const exportStems = true;
  const openAfterExport: 'none' | 'finder' | 'garageband' = clampOpenAfterExportForRuntime(runtime, 'finder');
  const rationale = [
    source === 'record' ? 'Picked Record Player for character rendering.' : 'Picked Generate for direct melodic flow.',
    mode === 'backing' ? 'Enabled backing for fuller arrangement.' : 'Kept single-track focus.',
    recordFamily === 'bug' ? `Bug mode ${recordBugMode} selected for controlled instability.` : `Using ${recordFamily} FX family for texture.`,
  ].join(' ');

  return {
    source,
    mode,
    instrument,
    eqMode,
    fxPreset,
    decayStyle,
    transpose,
    pitchRange,
    snapScale,
    modRate,
    modDepth,
    modTarget,
    growthStyle,
    durationStretch,
    timingFeel,
    timingAmount,
    backing,
    recordProfile,
    recordFamily,
    recordBugMode,
    recordIntensity,
    recordChaos,
    recordMix,
    recordScratch,
    recordWavy,
    openAfterExport,
    exportAudio,
    exportStems,
    length,
    bpm,
    seedPitch,
    rationale,
  };
}

function surpriseTheme(): string {
  const options = THEME_OPTIONS.filter((opt) => opt.value !== '__custom__').map((opt) => opt.value);
  return pickOne(options);
}

function surpriseLength(): number {
  return pickOne([8, 16, 16, 32]);
}

function surpriseBpm(theme: string): number {
  const t = theme.toLowerCase();
  if (t.includes('ambient') || t.includes('cinematic')) return pickOne([82, 90, 96, 104]);
  if (t.includes('trap')) return pickOne([132, 140, 148]);
  if (t.includes('techno') || t.includes('house') || t.includes('industrial')) return pickOne([122, 128, 132, 136]);
  return pickOne([90, 100, 110, 120, 128]);
}

function surpriseSeed(): number {
  return 48 + Math.floor(Math.random() * 25);
}

const RANGE_OPTIONS: Option<PitchRange>[] = [
  { value: 'low', label: 'Low', help: 'Darker lower register.' },
  { value: 'mid', label: 'Mid', help: 'Balanced melodic register.' },
  { value: 'high', label: 'High', help: 'Brighter upper register.' },
];

const TRANSPOSE_AMOUNT_OPTIONS: Option<number>[] = Array.from({ length: 12 }, (_, idx) => {
  const value = idx + 1;
  return { value, label: String(value), help: `${value} semitone${value === 1 ? '' : 's'}` };
});

const MOD_RATE_OPTIONS: Option<ModRate>[] = [
  { value: 'off', label: 'Off', help: 'No modulation.' },
  { value: 'slow', label: 'Slow', help: 'Gradual movement.' },
  { value: 'med', label: 'Medium', help: 'Moderate movement.' },
  { value: 'fast', label: 'Fast', help: 'Rapid movement.' },
];

const MOD_TARGET_OPTIONS: Option<ModTarget>[] = [
  { value: 'velocity', label: 'Velocity', help: 'Accent movement.' },
  { value: 'duration', label: 'Duration', help: 'Gate movement.' },
  { value: 'pitch', label: 'Pitch', help: 'Pitch movement.' },
];

const GROWTH_OPTIONS: Option<GrowthStyle>[] = [
  { value: 'flat', label: 'Flat', help: 'Keep energy level steady.' },
  { value: 'build', label: 'Build', help: 'Grow intensity over time.' },
];

const DURATION_STRETCH_OPTIONS: Option<number>[] = [
  { value: 1, label: '1.0x', help: 'Original duration feel.' },
  { value: 1.25, label: '1.25x', help: 'Slightly longer notes.' },
  { value: 1.5, label: '1.5x', help: 'Longer sustained notes.' },
  { value: 2, label: '2.0x', help: 'Much longer phrasing.' },
  { value: 3, label: '3.0x', help: 'Extended ambient feel.' },
];

const TIMING_FEEL_OPTIONS: Option<TimingFeel>[] = [
  { value: 'tight', label: 'Tight', help: 'Locked to grid feel.' },
  { value: 'human', label: 'Human', help: 'Subtle micro-timing drift.' },
  { value: 'offbeat', label: 'Offbeat', help: 'Intentional push/pull syncopation.' },
  { value: 'loose', label: 'Loose', help: 'Wider unquantized timing.' },
];

const GATE_OPTIONS: Option<GateStyle>[] = [
  { value: 'tight', label: 'Tight', help: 'Shorter note gates.' },
  { value: 'balanced', label: 'Balanced', help: 'Neutral gates.' },
  { value: 'long', label: 'Long', help: 'Longer gates.' },
];

const METRONOME_OPTIONS: Option<MetronomeMode>[] = [
  { value: 'off', label: 'Off', help: 'No click.' },
  { value: 'count-in', label: 'Count-in', help: '4-beat count before playback.' },
  { value: 'always', label: 'Always', help: 'Click during playback.' },
];

function recommendedProvider(defaultProvider: ProviderName): ProviderName {
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.GROQ_API_KEY) return 'groq';
  if (process.env.XAI_API_KEY) return 'grok';
  if (process.env.ANTHROPIC_API_KEY) return 'claude';
  return defaultProvider;
}

function providerOptions(): Option<ProviderName>[] {
  return [
    {
      value: 'mock',
      label: 'Demo mode',
      help: 'No API key needed. Best for first run.',
    },
    {
      value: 'openai',
      label: 'OpenAI / Codex',
      help: process.env.OPENAI_API_KEY
        ? 'Configured via OPENAI_API_KEY.'
        : 'Requires OPENAI_API_KEY.',
    },
    {
      value: 'gemini',
      label: 'Gemini',
      help: process.env.GEMINI_API_KEY
        ? 'Configured via GEMINI_API_KEY.'
        : 'Requires GEMINI_API_KEY.',
    },
    {
      value: 'claude',
      label: 'Claude',
      help: process.env.ANTHROPIC_API_KEY
        ? 'Configured via ANTHROPIC_API_KEY.'
        : 'Requires ANTHROPIC_API_KEY.',
    },
    {
      value: 'groq',
      label: 'Groq',
      help: process.env.GROQ_API_KEY
        ? 'Configured via GROQ_API_KEY.'
        : 'Requires GROQ_API_KEY.',
    },
    {
      value: 'grok',
      label: 'Grok (xAI)',
      help: process.env.XAI_API_KEY
        ? 'Configured via XAI_API_KEY.'
        : 'Requires XAI_API_KEY.',
    },
  ];
}

function parseProvider(inputValue: string): ProviderName | null {
  const normalized = inputValue.trim().toLowerCase();
  if (normalized === '1' || normalized === 'mock' || normalized === 'demo') return 'mock';
  if (normalized === '2' || normalized === 'openai' || normalized === 'codex') return 'openai';
  if (normalized === '3' || normalized === 'gemini') return 'gemini';
  if (normalized === '4' || normalized === 'claude') return 'claude';
  if (normalized === '5' || normalized === 'groq') return 'groq';
  if (normalized === '6' || normalized === 'grok' || normalized === 'xai') return 'grok';
  return null;
}

function section(title: string, subtitle?: string): void {
  console.log('');
  console.log(color(title, `${c.bold}${palette.primary}`));
  if (subtitle) console.log(color(subtitle, `${c.dim}${palette.soft}`));
}

async function ensureProviderCredentials(
  inputPrompt: InputPromptFn,
  passwordPrompt: PasswordPromptFn,
  provider: ProviderName,
): Promise<{ ok: boolean; auth: 'none' | 'env' | 'session' }> {
  if (provider === 'mock') {
    console.log(color('Using demo mode (no API key needed).', `${c.dim}${palette.soft}`));
    return { ok: true, auth: 'none' };
  }

  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    console.log(color('OPENAI_API_KEY detected in environment.', `${c.dim}${palette.soft}`));
    return { ok: true, auth: 'env' };
  }
  if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
    console.log(color('GEMINI_API_KEY detected in environment.', `${c.dim}${palette.soft}`));
    return { ok: true, auth: 'env' };
  }
  if (provider === 'claude' && process.env.ANTHROPIC_API_KEY) {
    console.log(color('ANTHROPIC_API_KEY detected in environment.', `${c.dim}${palette.soft}`));
    return { ok: true, auth: 'env' };
  }
  if (provider === 'groq' && process.env.GROQ_API_KEY) {
    console.log(color('GROQ_API_KEY detected in environment.', `${c.dim}${palette.soft}`));
    return { ok: true, auth: 'env' };
  }
  if (provider === 'grok' && process.env.XAI_API_KEY) {
    console.log(color('XAI_API_KEY detected in environment.', `${c.dim}${palette.soft}`));
    return { ok: true, auth: 'env' };
  }

  const keyName = provider === 'openai'
    ? 'OPENAI_API_KEY'
    : provider === 'gemini'
      ? 'GEMINI_API_KEY'
    : provider === 'claude'
      ? 'ANTHROPIC_API_KEY'
      : provider === 'groq'
        ? 'GROQ_API_KEY'
        : 'XAI_API_KEY';
  console.log(color(`${keyName} is not set.`, c.yellow));
  console.log(color('Paste key for this session (not saved to disk).', c.dim));
  const key = await passwordPrompt({
    message: `${keyName}`,
    validate: (value: string) => (value.trim() ? true : 'Key is required'),
  });
  const trimmed = key.trim();
  if (!trimmed) {
    console.log(color('No key entered.', c.red));
    return { ok: false, auth: 'none' };
  }

  if (provider === 'openai') {
    process.env.OPENAI_API_KEY = trimmed;
  } else if (provider === 'gemini') {
    process.env.GEMINI_API_KEY = trimmed;
  } else if (provider === 'claude') {
    process.env.ANTHROPIC_API_KEY = trimmed;
  } else if (provider === 'groq') {
    process.env.GROQ_API_KEY = trimmed;
  } else {
    process.env.XAI_API_KEY = trimmed;
  }
  console.log(color(`${keyName} received for this session.`, `${c.bold}${palette.primary}`));
  return { ok: true, auth: 'session' };
}

async function pickProvider(
  selectPrompt: SelectPromptFn,
  inputPrompt: InputPromptFn,
  passwordPrompt: PasswordPromptFn,
  fallback: ProviderName,
): Promise<{ provider: ProviderName; auth: 'none' | 'env' | 'session' }> {
  const recommended = recommendedProvider(fallback);
  const options = providerOptions();

  while (true) {
    const selected = await selectPrompt({
      message: 'Choose AI provider',
      default: recommended,
      choices: options.map((option) => ({
        value: option.value,
        name: option.label,
        description: option.help,
      })),
      theme: inquirerTheme,
    });

    const cred = await ensureProviderCredentials(inputPrompt, passwordPrompt, selected);
    if (cred.ok) {
      return { provider: selected, auth: cred.auth };
    }

    console.log(color('Provider key not set. Choose provider again or select mock mode.', c.red));
  }
}

async function pickTheme(
  selectPrompt: SelectPromptFn,
  inputPrompt: InputPromptFn,
  fallback: string,
): Promise<string> {
  const selected = await selectPrompt({
    message: 'Pick music style',
    choices: THEME_OPTIONS.map((option) => ({
      value: option.value,
      name: option.label,
      description: option.help,
    })),
    theme: inquirerTheme,
  });

  if (selected === '__custom__') {
    const custom = await inputPrompt({
      message: 'Enter custom theme',
      default: fallback,
      validate: (value: string) => (value.trim() ? true : 'Theme is required'),
      theme: inquirerTheme,
    });
    return custom.trim() || fallback;
  }
  return selected;
}

async function pickLength(
  selectPrompt: SelectPromptFn,
  inputPrompt: InputPromptFn,
  fallback: number,
): Promise<number> {
  const selected = await selectPrompt({
    message: 'Pick length',
    choices: LENGTH_OPTIONS.map((option) => ({
      value: option.value,
      name: option.label,
      description: option.help,
    })),
    theme: inquirerTheme,
  });
  if (selected === -1) {
    const custom = await inputPrompt({
      message: 'Custom length in notes',
      default: String(fallback),
      validate: (value: string) => (asPositiveInt(value, 0) > 0 ? true : 'Enter a positive number'),
      theme: inquirerTheme,
    });
    return asPositiveInt(custom, fallback);
  }
  return selected;
}

async function pickBpm(
  selectPrompt: SelectPromptFn,
  inputPrompt: InputPromptFn,
  fallback: number,
): Promise<number> {
  const selected = await selectPrompt({
    message: 'Pick BPM',
    choices: BPM_OPTIONS.map((option) => ({
      value: option.value,
      name: option.label,
      description: option.help,
    })),
    theme: inquirerTheme,
  });
  if (selected === -1) {
    const custom = await inputPrompt({
      message: 'Custom BPM',
      default: String(fallback),
      validate: (value: string) => (asPositiveInt(value, 0) > 0 ? true : 'Enter a positive number'),
      theme: inquirerTheme,
    });
    return asPositiveInt(custom, fallback);
  }
  return selected;
}

async function pickBoundedNumber(
  selectPrompt: SelectPromptFn,
  inputPrompt: InputPromptFn,
  opts: {
    message: string;
    fallback: number;
    min: number;
    max: number;
    presets?: number[];
    fractions?: number[];
    customLabel?: string;
    customMessage?: string;
  },
): Promise<number> {
  const fractionValues = (opts.fractions ?? [0, 0.25, 0.5, 0.75, 1]).map((f) =>
    Math.round(opts.min + (opts.max - opts.min) * Math.max(0, Math.min(1, f))),
  );
  const presetValues = [...new Set([...(opts.presets ?? []), ...fractionValues])]
    .filter((v) => v >= opts.min && v <= opts.max)
    .sort((a, b) => a - b);

  const choices = [
    { value: -1, name: opts.customLabel ?? 'Custom', description: `Type ${opts.min}..${opts.max}` },
    ...presetValues.map((value) => ({
      value,
      name: String(value),
      description: value === opts.fallback ? 'Current default' : undefined,
    })),
  ];

  const selected = (await selectPrompt({
    message: opts.message,
    choices,
    default: presetValues.includes(opts.fallback) ? opts.fallback : -1,
    theme: inquirerTheme,
  })) as number;

  if (selected !== -1) return selected;
  const custom = await inputPrompt({
    message: opts.customMessage ?? `${opts.message} (${opts.min}..${opts.max})`,
    default: String(opts.fallback),
    validate: (value: string) => {
      const parsed = Number.parseInt(value, 10);
      if (!Number.isFinite(parsed)) return 'Enter a number';
      if (parsed < opts.min || parsed > opts.max) return `Must be ${opts.min}..${opts.max}`;
      return true;
    },
    theme: inquirerTheme,
  });
  return asBoundedInt(custom, opts.fallback, opts.min, opts.max);
}

export async function promptCliConfig(defaults: CliConfig): Promise<CliConfig> {
  console.log(`\n${color('OpenNote CLI Setup', `${c.bold}${palette.primary}`)}`);
  console.log(color('Use arrow keys and Enter.', `${c.dim}${palette.soft}`));
  console.log(color('----------------------------------------', `${c.dim}${palette.soft}`));

  let selectPrompt: SelectPromptFn;
  let inputPrompt: InputPromptFn;
  let passwordPrompt: PasswordPromptFn;

  try {
    const inquirer = await import('@inquirer/prompts');
    selectPrompt = inquirer.select as typeof selectPrompt;
    inputPrompt = inquirer.input;
    passwordPrompt = inquirer.password;
  } catch {
    console.log(color('Arrow-key prompts need @inquirer/prompts installed.', c.yellow));
    console.log('Run: npm install');
    throw new Error('Missing dependency: @inquirer/prompts');
  }

  while (true) {
    section('1) Provider', 'Pick model provider (Demo mode - Quickstart).');
    const providerResult = await pickProvider(
      (cfg) => selectPrompt(cfg) as Promise<ProviderName>,
      inputPrompt,
      passwordPrompt,
      defaults.provider,
    );
    const provider = providerResult.provider;
    const providerAuth = providerResult.auth;

    section('2) Setup Path', 'Choose Basic, Surprise me or Advanced for full audio controls.');
    const setupPath = (await selectPrompt({
      message: 'Setup path',
      choices: SETUP_PATH_OPTIONS.map((option) => ({
        value: option.value,
        name: option.label,
        description: option.help,
      })),
      default: 'basic',
      theme: inquirerTheme,
    })) as SetupPath;

    if (setupPath === 'surprise') {
      const surpriseStrength = (await selectPrompt({
        message: 'Surprise strength',
        choices: SURPRISE_STRENGTH_OPTIONS.map((option) => ({
          value: option.value,
          name: option.label,
          description: option.help,
        })),
        default: 'medium',
        theme: inquirerTheme,
      })) as SurpriseStrength;
      const theme = surpriseTheme();
      const picked = surprisePreset(defaults.runtime, theme, surpriseStrength);
      const config: CliConfig = {
        runtime: defaults.runtime,
        provider,
        providerAuth,
        source: picked.source,
        mode: picked.mode,
        instrument: picked.instrument,
        fxPreset: picked.fxPreset,
        decayStyle: picked.decayStyle,
        transpose: picked.transpose,
        pitchRange: picked.pitchRange,
        snapScale: picked.snapScale,
        modRate: picked.modRate,
        modDepth: picked.modDepth,
        modTarget: picked.modTarget,
        growthStyle: picked.growthStyle,
        durationStretch: picked.durationStretch,
        timingFeel: picked.timingFeel,
        timingAmount: picked.timingAmount,
        backing: picked.backing,
        theme,
        length: picked.length,
        bpm: picked.bpm,
        seedPitch: picked.seedPitch,
        seedSource: 'manual',
        beep: false,
        openAfterExport: picked.openAfterExport,
        exportAudio: picked.exportAudio,
        exportStems: picked.exportStems,
        eqMode: picked.eqMode,
        recordDevice: defaults.recordDevice,
        recordSeconds: defaults.recordSeconds,
        recordMonitor: defaults.recordMonitor,
        recordProfile: picked.recordProfile,
        recordFamily: picked.recordFamily,
        recordBugMode: picked.recordBugMode,
        recordIntensity: picked.recordIntensity,
        recordChaos: picked.recordChaos,
        recordMix: picked.recordMix,
        recordScratch: picked.recordScratch,
        recordWavy: picked.recordWavy,
      };

      section('Surprise Setup', 'Auto-picked configuration. Starting generation now.');
      console.log(color(`Strength:   ${surpriseStrength}`, `${c.dim}${palette.soft}`));
      console.log(color(`Theme:      ${config.theme}`, `${c.dim}${palette.soft}`));
      console.log(color(`Source:     ${config.source}`, `${c.dim}${palette.soft}`));
      console.log(color(`Mode:       ${config.mode}`, `${c.dim}${palette.soft}`));
      console.log(color(`Instrument: ${config.instrument}`, `${c.dim}${palette.soft}`));
      console.log(color(`EQ:         ${config.eqMode}`, `${c.dim}${palette.soft}`));
      console.log(color(`FX:         ${config.fxPreset} / ${config.decayStyle}`, `${c.dim}${palette.soft}`));
      console.log(color(`Length/BPM: ${config.length} / ${config.bpm}`, `${c.dim}${palette.soft}`));
      console.log(color(`Seed pitch: ${config.seedPitch}`, `${c.dim}${palette.soft}`));
      if (config.source === 'record' || config.recordBugMode !== 'off') {
        console.log(color(`Record FX:  ${config.recordFamily} / ${config.recordBugMode} / ${config.recordScratch}`, `${c.dim}${palette.soft}`));
      }
      console.log(color(`Rationale:  ${picked.rationale}`, `${c.dim}${palette.soft}`));
      console.log('');
      return config;
    }

    if (setupPath === 'basic') {
      section('3) Style', 'Choose a preset music category or custom theme.');
      const theme = await pickTheme((cfg) => selectPrompt(cfg) as Promise<string>, inputPrompt, defaults.theme);

      section('4) Structure', 'Set length and tempo.');
      const length = await pickLength(
        (cfg) => selectPrompt(cfg) as Promise<number>,
        inputPrompt,
        defaults.length,
      );
      const bpm = await pickBpm((cfg) => selectPrompt(cfg) as Promise<number>, inputPrompt, defaults.bpm);

      section('5) Input', 'Basic path uses manual seed input.');
      const seedPitch = await pickBoundedNumber(
        (cfg) => selectPrompt(cfg) as Promise<number>,
        inputPrompt,
        {
          message: 'Choose note (MIDI 0..127)',
          fallback: defaults.seedPitch,
          min: 0,
          max: 127,
          fractions: [0, 0.25, 0.5, 0.75, 1],
          customMessage: 'Custom note (MIDI 0..127)',
        },
      );

      const config: CliConfig = {
        runtime: defaults.runtime,
        provider,
        providerAuth,
        source: 'generated',
        mode: 'single',
        instrument: 'lead',
        fxPreset: 'clean',
        decayStyle: 'balanced',
        transpose: 0,
        pitchRange: 'mid',
        snapScale: false,
        modRate: 'off',
        modDepth: 0,
        modTarget: 'velocity',
        growthStyle: 'flat',
        durationStretch: 1.25,
        timingFeel: 'tight',
        timingAmount: 0,
        backing: {
          drums: false,
          bass: false,
          clap: false,
          openHat: false,
          perc: false,
          metronome: 'off',
          swing: 0,
          gate: 'balanced',
          mutate: 0,
          deviate: 0,
        },
        theme,
        length,
        bpm,
        seedPitch,
        seedSource: 'manual',
        beep: false,
        openAfterExport: clampOpenAfterExportForRuntime(defaults.runtime, 'finder'),
        exportAudio: clampExportAudioForRuntime(defaults.runtime, 'mp4'),
        exportStems: true,
        eqMode: defaults.eqMode,
        recordDevice: defaults.recordDevice,
        recordSeconds: defaults.recordSeconds,
        recordMonitor: defaults.recordMonitor,
        recordProfile: defaults.recordProfile,
        recordFamily: defaults.recordFamily,
        recordBugMode: defaults.recordBugMode,
        recordIntensity: defaults.recordIntensity,
        recordChaos: defaults.recordChaos,
        recordMix: defaults.recordMix,
        recordScratch: defaults.recordScratch,
        recordWavy: defaults.recordWavy,
      };

      section('Basic Setup', 'Using quick defaults. Starting generation now.');
      console.log(color(`Theme:      ${config.theme}`, `${c.dim}${palette.soft}`));
      console.log(color(`Length/BPM: ${config.length} / ${config.bpm}`, `${c.dim}${palette.soft}`));
      console.log(color(`Seed pitch: ${config.seedPitch}`, `${c.dim}${palette.soft}`));
      console.log(color(`Export:     ${config.exportAudio} + ${config.openAfterExport}`, `${c.dim}${palette.soft}`));
      console.log('');
      return config;
    }

    let source = defaults.source;
    let mode = defaults.mode;
    let instrument = defaults.instrument;
    let fxPreset = defaults.fxPreset;
    let decayStyle = defaults.decayStyle;
    let recordDevice = defaults.recordDevice;
    let recordSeconds = defaults.recordSeconds;
    let recordMonitor = defaults.recordMonitor;
    let recordProfile = defaults.recordProfile;
    let recordFamily = defaults.recordFamily;
    let recordBugMode = defaults.recordBugMode;
    let recordIntensity = defaults.recordIntensity;
    let recordChaos = defaults.recordChaos;
    let recordMix = defaults.recordMix;
    let recordScratch = defaults.recordScratch;
    let recordWavy = defaults.recordWavy;
    let eqMode = defaults.eqMode;

    section('3) Mode', 'Single track keeps it minimal. AI backing reveals arrangement controls.');
    mode = (await selectPrompt({
      message: 'Generation mode',
      choices: MODE_OPTIONS.map((option) => ({
        value: option.value,
        name: option.label,
        description: option.help,
      })),
      default: defaults.mode,
      theme: inquirerTheme,
    })) as GenerationMode;

    section('4) Instrument', 'Choose instrument profile for output mapping.');
    instrument = (await selectPrompt({
      message: 'Instrument',
      choices: INSTRUMENT_OPTIONS.map((option) => ({
        value: option.value,
        name: option.label,
        description: option.help,
      })),
      default: defaults.instrument,
      theme: inquirerTheme,
    })) as InstrumentName;

    section('5) Source', 'Choose output style for the generated take.');
    source = (await selectPrompt({
      message: 'Source',
      choices: SOURCE_OPTIONS.map((option) => ({
        value: option.value,
        name: option.label,
        description: option.help,
      })),
      default: defaults.source,
      theme: inquirerTheme,
    })) as 'generated' | 'record';

    section('5b) EQ', 'General output equalizer profile.');
    eqMode = (await selectPrompt({
      message: 'EQ mode',
      choices: EQ_MODE_OPTIONS.map((option) => ({
        value: option.value,
        name: option.label,
        description: option.help,
      })),
      default: defaults.eqMode,
      theme: inquirerTheme,
    })) as 'balanced' | 'flat' | 'warm' | 'bright' | 'bass' | 'phone';

    if (source === 'generated') {
      section('6) FX', 'Choose tone shaping profile and decay behavior.');
      fxPreset = (await selectPrompt({
        message: 'FX preset',
        choices: FX_PRESET_OPTIONS.map((option) => ({
          value: option.value,
          name: option.label,
          description: option.help,
        })),
        default: defaults.fxPreset,
        theme: inquirerTheme,
      })) as FxPresetName;

      decayStyle = (await selectPrompt({
        message: 'Decay style',
        choices: DECAY_OPTIONS.map((option) => ({
          value: option.value,
          name: option.label,
          description: option.help,
        })),
        default: defaults.decayStyle,
        theme: inquirerTheme,
      })) as DecayStyle;

      section('6b) Experimental', 'Optional post-render bug mode (works in Generate too).');
      recordBugMode = (await selectPrompt({
        message: 'Bug mode',
        choices: BUG_MODE_OPTIONS.map((option) => ({
          value: option.value,
          name: option.label,
          description: option.help,
        })),
        default: defaults.recordBugMode,
        theme: inquirerTheme,
      })) as 'off' | 'pll-drift' | 'buffer-tear' | 'clock-bleed' | 'memory-rot' | 'crc-glitch';
      if (recordBugMode !== 'off') {
        recordFamily = 'bug';
        recordIntensity = await pickBoundedNumber(
          (cfg) => selectPrompt(cfg) as Promise<number>,
          inputPrompt,
          { message: 'Bug intensity (0..100)', fallback: defaults.recordIntensity, min: 0, max: 100, fractions: [0, 0.2, 0.4, 0.6, 0.8, 1] },
        );
        recordMix = await pickBoundedNumber(
          (cfg) => selectPrompt(cfg) as Promise<number>,
          inputPrompt,
          { message: 'Bug mix (0..100)', fallback: defaults.recordMix, min: 0, max: 100, fractions: [0, 0.2, 0.4, 0.6, 0.8, 1] },
        );
        recordChaos = await pickBoundedNumber(
          (cfg) => selectPrompt(cfg) as Promise<number>,
          inputPrompt,
          { message: 'Bug chaos (0..100)', fallback: defaults.recordChaos, min: 0, max: 100, fractions: [0, 0.2, 0.4, 0.6, 0.8, 1] },
        );
      } else {
        recordFamily = 'character';
        recordIntensity = 0;
        recordMix = 0;
        recordChaos = 0;
      }
      recordProfile = 'default';
      recordScratch = 'off';
      recordWavy = 0;
    } else {
      section('6) Record Player', 'Emulate vinyl tone and scratching on rendered audio.');
      recordProfile = (await selectPrompt({
        message: 'Record tone',
        choices: RECORD_PROFILE_OPTIONS.map((option) => ({
          value: option.value,
          name: option.label,
          description: option.help,
        })),
        default: defaults.recordProfile,
        theme: inquirerTheme,
      })) as 'default' | 'vinyl' | 'dust';
      recordFamily = (await selectPrompt({
        message: 'FX family',
        choices: RECORD_FAMILY_OPTIONS.map((option) => ({
          value: option.value,
          name: option.label,
          description: option.help,
        })),
        default: defaults.recordFamily,
        theme: inquirerTheme,
      })) as 'character' | 'motion' | 'space' | 'bug';
      if (recordFamily === 'bug') {
        recordBugMode = (await selectPrompt({
          message: 'Bug mode',
          choices: BUG_MODE_OPTIONS.map((option) => ({
            value: option.value,
            name: option.label,
            description: option.help,
          })),
          default: defaults.recordBugMode,
          theme: inquirerTheme,
        })) as 'off' | 'pll-drift' | 'buffer-tear' | 'clock-bleed' | 'memory-rot' | 'crc-glitch';
      } else {
        recordBugMode = 'off';
      }
      const scratchRaw = (await selectPrompt({
        message: 'Scratch technique',
        choices: [
          { value: 'off', name: 'Off', description: 'No scratch texture.' },
          { value: 'texture', name: 'Texture', description: 'Subtle scratch character.' },
          { value: 'dj', name: 'DJ Scratch', description: 'Stronger replay-style scratch motion.' },
        ],
        default: defaults.recordScratch,
        theme: inquirerTheme,
      })) as 'off' | 'texture' | 'dj';
      recordScratch = scratchRaw;
      recordWavy = await pickBoundedNumber(
        (cfg) => selectPrompt(cfg) as Promise<number>,
        inputPrompt,
        { message: 'Wobble amount (0..100)', fallback: defaults.recordWavy, min: 0, max: 100, fractions: [0, 0.2, 0.4, 0.6, 0.8, 1] },
      );
      recordIntensity = await pickBoundedNumber(
        (cfg) => selectPrompt(cfg) as Promise<number>,
        inputPrompt,
        { message: 'FX intensity (0..100)', fallback: defaults.recordIntensity, min: 0, max: 100, fractions: [0, 0.2, 0.4, 0.6, 0.8, 1] },
      );
      recordMix = await pickBoundedNumber(
        (cfg) => selectPrompt(cfg) as Promise<number>,
        inputPrompt,
        { message: 'FX mix (0..100)', fallback: defaults.recordMix, min: 0, max: 100, fractions: [0, 0.2, 0.4, 0.6, 0.8, 1] },
      );
      recordChaos = await pickBoundedNumber(
        (cfg) => selectPrompt(cfg) as Promise<number>,
        inputPrompt,
        { message: 'Chaos (0..100)', fallback: defaults.recordChaos, min: 0, max: 100, fractions: [0, 0.2, 0.4, 0.6, 0.8, 1] },
      );
      recordDevice = '';
      recordSeconds = defaults.recordSeconds;
      recordMonitor = false;
    }

    let transpose = defaults.transpose;
    let pitchRange = defaults.pitchRange;
    let snapScale = defaults.snapScale;
    let modRate = defaults.modRate;
    let modDepth = defaults.modDepth;
    let modTarget = defaults.modTarget;
    let growthStyle = defaults.growthStyle;
    let durationStretch = defaults.durationStretch;
    let timingFeel = defaults.timingFeel;
    let timingAmount = defaults.timingAmount;
    let backing: BackingControls = mode === 'backing'
      ? { ...defaults.backing }
      : {
          drums: false,
          bass: false,
          clap: false,
          openHat: false,
          perc: false,
          metronome: 'off',
          swing: 0,
          gate: 'balanced',
          mutate: 0,
          deviate: 0,
        };

    if (setupPath === 'advanced') {
      section('7) Pitch', 'Transpose and range controls with optional scale snap.');
      const transposeDirection = (await selectPrompt({
        message: 'Transpose direction',
        choices: [
          { value: 'down', name: 'Down (-)', description: 'Shift pitches lower.' },
          { value: 'none', name: 'Neutral (0)', description: 'No transpose shift.' },
          { value: 'up', name: 'Up (+)', description: 'Shift pitches higher.' },
        ],
        default: defaults.transpose === 0 ? 'none' : defaults.transpose < 0 ? 'down' : 'up',
        theme: inquirerTheme,
      })) as 'down' | 'none' | 'up';

      if (transposeDirection === 'none') {
        transpose = 0;
      } else {
        const transposeAmount = (await selectPrompt({
          message: 'Transpose amount',
          choices: TRANSPOSE_AMOUNT_OPTIONS.map((option) => ({
            value: option.value,
            name: option.label,
            description: option.help,
          })),
          default: Math.max(1, Math.min(12, Math.abs(defaults.transpose))),
          theme: inquirerTheme,
        })) as number;
        transpose = transposeDirection === 'down' ? -transposeAmount : transposeAmount;
      }

      pitchRange = (await selectPrompt({
        message: 'Pitch range',
        choices: RANGE_OPTIONS.map((option) => ({
          value: option.value,
          name: option.label,
          description: option.help,
        })),
        default: defaults.pitchRange,
        theme: inquirerTheme,
      })) as PitchRange;

      const snapScaleRaw = (await selectPrompt({
        message: 'Snap to scale',
        choices: [
          { value: 'off', name: 'Off', description: 'Keep full chromatic freedom.' },
          { value: 'on', name: 'On', description: 'Constrain to major scale tones.' },
        ],
        default: defaults.snapScale ? 'on' : 'off',
        theme: inquirerTheme,
      })) as 'on' | 'off';
      snapScale = snapScaleRaw === 'on';

      section('8) Modulate', 'Add movement to velocity, duration, or pitch.');
      modRate = (await selectPrompt({
        message: 'Modulation rate',
        choices: MOD_RATE_OPTIONS.map((option) => ({
          value: option.value,
          name: option.label,
          description: option.help,
        })),
        default: defaults.modRate,
        theme: inquirerTheme,
      })) as ModRate;

      modDepth = await pickBoundedNumber(
        (cfg) => selectPrompt(cfg) as Promise<number>,
        inputPrompt,
        { message: 'Modulation depth (0..100)', fallback: defaults.modDepth, min: 0, max: 100, fractions: [0, 0.2, 0.4, 0.6, 0.8, 1] },
      );

      modTarget = (await selectPrompt({
        message: 'Modulation target',
        choices: MOD_TARGET_OPTIONS.map((option) => ({
          value: option.value,
          name: option.label,
          description: option.help,
        })),
        default: defaults.modTarget,
        theme: inquirerTheme,
      })) as ModTarget;

      section('9) Movement', 'Control song growth over time and overall note length.');
      growthStyle = (await selectPrompt({
        message: 'Growth over time',
        choices: GROWTH_OPTIONS.map((option) => ({
          value: option.value,
          name: option.label,
          description: option.help,
        })),
        default: defaults.growthStyle,
        theme: inquirerTheme,
      })) as GrowthStyle;

      durationStretch = (await selectPrompt({
        message: 'Duration stretch',
        choices: DURATION_STRETCH_OPTIONS.map((option) => ({
          value: option.value,
          name: option.label,
          description: option.help,
        })),
        default: defaults.durationStretch,
        theme: inquirerTheme,
      })) as number;

      timingFeel = (await selectPrompt({
        message: 'Timing feel',
        choices: TIMING_FEEL_OPTIONS.map((option) => ({
          value: option.value,
          name: option.label,
          description: option.help,
        })),
        default: defaults.timingFeel,
        theme: inquirerTheme,
      })) as TimingFeel;

      timingAmount = await pickBoundedNumber(
        (cfg) => selectPrompt(cfg) as Promise<number>,
        inputPrompt,
        { message: 'Timing amount (0..100)', fallback: defaults.timingAmount, min: 0, max: 100, fractions: [0, 0.2, 0.4, 0.6, 0.8, 1] },
      );

      if (mode === 'backing') {
        section('10) Backing', 'Enable drums/bass and shape groove behavior.');
        const drumsRaw = (await selectPrompt({
          message: 'Drums',
          choices: [
            { value: 'on', name: 'On', description: 'Add style-based kick/snare/hihat.' },
            { value: 'off', name: 'Off', description: 'No drum backing.' },
          ],
          default: defaults.backing.drums ? 'on' : 'off',
          theme: inquirerTheme,
        })) as 'on' | 'off';
        const bassRaw = (await selectPrompt({
          message: 'Bass',
          choices: [
            { value: 'off', name: 'Off', description: 'Melody and drums only.' },
            { value: 'on', name: 'On', description: 'Add low-register backing notes.' },
          ],
          default: defaults.backing.bass ? 'on' : 'off',
          theme: inquirerTheme,
        })) as 'on' | 'off';
        const clapRaw = (await selectPrompt({
          message: 'Clap',
          choices: [
            { value: 'off', name: 'Off', description: 'No clap layer.' },
            { value: 'on', name: 'On', description: 'Add clap accents.' },
          ],
          default: defaults.backing.clap ? 'on' : 'off',
          theme: inquirerTheme,
        })) as 'on' | 'off';
        const openHatRaw = (await selectPrompt({
          message: 'Open hat',
          choices: [
            { value: 'off', name: 'Off', description: 'No open hat layer.' },
            { value: 'on', name: 'On', description: 'Add open hat accents.' },
          ],
          default: defaults.backing.openHat ? 'on' : 'off',
          theme: inquirerTheme,
        })) as 'on' | 'off';
        const percRaw = (await selectPrompt({
          message: 'Perc',
          choices: [
            { value: 'off', name: 'Off', description: 'No extra percussion.' },
            { value: 'on', name: 'On', description: 'Add extra percussion hits.' },
          ],
          default: defaults.backing.perc ? 'on' : 'off',
          theme: inquirerTheme,
        })) as 'on' | 'off';
        const metronome = (await selectPrompt({
          message: 'Metronome',
          choices: METRONOME_OPTIONS.map((option) => ({
            value: option.value,
            name: option.label,
            description: option.help,
          })),
          default: defaults.backing.metronome,
          theme: inquirerTheme,
        })) as MetronomeMode;
        const gate = (await selectPrompt({
          message: 'Gate',
          choices: GATE_OPTIONS.map((option) => ({
            value: option.value,
            name: option.label,
            description: option.help,
          })),
          default: defaults.backing.gate,
          theme: inquirerTheme,
        })) as GateStyle;

        const swing = await pickBoundedNumber(
          (cfg) => selectPrompt(cfg) as Promise<number>,
          inputPrompt,
          { message: 'Swing (0..100)', fallback: defaults.backing.swing, min: 0, max: 100, fractions: [0, 0.2, 0.4, 0.6, 0.8, 1] },
        );
        const mutate = await pickBoundedNumber(
          (cfg) => selectPrompt(cfg) as Promise<number>,
          inputPrompt,
          { message: 'Mutate (0..100)', fallback: defaults.backing.mutate, min: 0, max: 100, fractions: [0, 0.2, 0.4, 0.6, 0.8, 1] },
        );
        const deviate = await pickBoundedNumber(
          (cfg) => selectPrompt(cfg) as Promise<number>,
          inputPrompt,
          { message: 'Deviate (0..100)', fallback: defaults.backing.deviate, min: 0, max: 100, fractions: [0, 0.2, 0.4, 0.6, 0.8, 1] },
        );

        backing = {
          drums: drumsRaw === 'on',
          bass: bassRaw === 'on',
          clap: clapRaw === 'on',
          openHat: openHatRaw === 'on',
          perc: percRaw === 'on',
          metronome,
          swing,
          gate,
          mutate,
          deviate,
        };
      }
    }

    section('11) Style', 'Choose a preset music category or custom theme.');
    const theme = await pickTheme((cfg) => selectPrompt(cfg) as Promise<string>, inputPrompt, defaults.theme);
    section('12) Structure', 'Set length and tempo.');
    const length = await pickLength((cfg) => selectPrompt(cfg) as Promise<number>, inputPrompt, defaults.length);
    const bpm = await pickBpm((cfg) => selectPrompt(cfg) as Promise<number>, inputPrompt, defaults.bpm);

    let seedSource = setupPath === 'advanced'
      ? (await selectPrompt({
          message: 'Seed input mode',
          choices: SEED_SOURCE_OPTIONS.map((option) => ({
            value: option.value,
            name: option.label,
            description: option.help,
          })),
          default: defaults.seedSource,
          theme: inquirerTheme,
        })) as 'manual' | 'keyboard'
      : 'manual';

    let seedPitch = defaults.seedPitch;
    let seedPitchChosen = false;
    if (seedSource === 'keyboard') {
      const keyboardPath = (await selectPrompt({
        message: 'Keyboard input',
        choices: [
          { value: 'keyboard', name: 'Live keyboard capture', description: 'Use 1-8 keys when generation starts.' },
          { value: 'preset', name: 'Preset note list', description: 'Pick from quick MIDI note presets.' },
          { value: 'custom', name: 'Custom MIDI value', description: 'Type a note value directly.' },
        ],
        default: 'keyboard',
        theme: inquirerTheme,
      })) as 'keyboard' | 'preset' | 'custom';

      if (keyboardPath === 'preset') {
        seedPitch = await pickBoundedNumber(
          (cfg) => selectPrompt(cfg) as Promise<number>,
          inputPrompt,
          {
            message: 'Choose note (MIDI 0..127)',
            fallback: defaults.seedPitch,
            min: 0,
            max: 127,
            fractions: [0, 0.25, 0.5, 0.75, 1],
            customMessage: 'Custom note (MIDI 0..127)',
          },
        );
        seedSource = 'manual';
        seedPitchChosen = true;
      } else if (keyboardPath === 'custom') {
        seedPitch = await pickBoundedNumber(
          (cfg) => selectPrompt(cfg) as Promise<number>,
          inputPrompt,
          {
            message: 'Choose note (MIDI 0..127)',
            fallback: defaults.seedPitch,
            min: 0,
            max: 127,
            fractions: [],
            customMessage: 'Custom note (MIDI 0..127)',
          },
        );
        seedSource = 'manual';
        seedPitchChosen = true;
      }
    }

    if (seedSource === 'manual' && !seedPitchChosen) {
      section('13) Input', setupPath === 'advanced' ? 'Choose seed note input mode.' : 'Basic path uses manual seed input.');
      seedPitch = await pickBoundedNumber(
        (cfg) => selectPrompt(cfg) as Promise<number>,
        inputPrompt,
        {
          message: 'Choose note (MIDI 0..127)',
          fallback: defaults.seedPitch,
          min: 0,
          max: 127,
          fractions: [0, 0.25, 0.5, 0.75, 1],
          customMessage: 'Custom note (MIDI 0..127)',
        },
      );
    }

    const beep = false;

    section('14) Export Open Action', 'What should happen right after export?');
    const openAfterExportOptions = getOpenAfterExportOptions(defaults.runtime);
    const openAfterExport = (await selectPrompt({
      message: 'After export',
      choices: openAfterExportOptions.map((option) => ({
        value: option.value,
        name: option.label,
        description: option.help,
      })),
      default: clampOpenAfterExportForRuntime(defaults.runtime, defaults.openAfterExport),
      theme: inquirerTheme,
    })) as 'none' | 'finder' | 'garageband';

    section('15) Export Media Format', 'Optional extra export format when you choose export actions.');
    const exportAudioOptions = getExportAudioOptions(defaults.runtime, source);
    const exportAudio = (await selectPrompt({
      message: 'Export profile',
      choices: exportAudioOptions.map((option) => ({
        value: option.value,
        name: option.label,
        description: option.help,
      })),
      default: clampExportAudioForRuntime(
        defaults.runtime,
        defaults.exportAudio === 'none' ? (isWebRuntime(defaults.runtime) ? 'wav' : 'mp4') : defaults.exportAudio,
      ),
      theme: inquirerTheme,
    })) as 'none' | 'wav' | 'mp3' | 'mp4';

    const config = {
      runtime: defaults.runtime,
      provider,
      providerAuth,
      source,
      mode,
      instrument,
      fxPreset,
      decayStyle,
      transpose,
      pitchRange,
      snapScale,
      modRate,
      modDepth,
      modTarget,
      growthStyle,
      durationStretch,
      timingFeel,
      timingAmount,
      backing,
      theme,
      length,
      bpm,
      seedPitch,
      seedSource,
      beep,
      openAfterExport,
      exportAudio,
      exportStems: exportAudio === 'none' ? defaults.exportStems : true,
      eqMode,
      recordDevice,
      recordSeconds,
      recordMonitor,
      recordProfile,
      recordFamily,
      recordBugMode,
      recordIntensity,
      recordChaos,
      recordMix,
      recordScratch,
      recordWavy,
    };

    section('Summary');
    console.log(color(`Provider:   ${config.provider}`, `${c.dim}${palette.soft}`));
    console.log(color(`Auth:       ${config.providerAuth}`, `${c.dim}${palette.soft}`));
    console.log(color(`Path:       ${setupPath}`, `${c.dim}${palette.soft}`));
    console.log(color(`Source:     ${config.source}`, `${c.dim}${palette.soft}`));
    console.log(color(`Mode:       ${config.mode}`, `${c.dim}${palette.soft}`));
    console.log(color(`Instrument: ${config.instrument}`, `${c.dim}${palette.soft}`));
    console.log(color(`FX preset:  ${config.fxPreset}`, `${c.dim}${palette.soft}`));
    console.log(color(`Decay:      ${config.decayStyle}`, `${c.dim}${palette.soft}`));
    console.log(color(`Pitch:      transpose ${config.transpose}, range ${config.pitchRange}, snap ${config.snapScale ? 'on' : 'off'}`, `${c.dim}${palette.soft}`));
    console.log(color(`Modulate:   ${config.modRate} depth ${config.modDepth} target ${config.modTarget}`, `${c.dim}${palette.soft}`));
    console.log(color(`Growth:     ${config.growthStyle}`, `${c.dim}${palette.soft}`));
    console.log(color(`Duration:   ${config.durationStretch}x`, `${c.dim}${palette.soft}`));
    console.log(color(`Timing:     ${config.timingFeel} (${config.timingAmount})`, `${c.dim}${palette.soft}`));
    console.log(color(`EQ mode:    ${config.eqMode}`, `${c.dim}${palette.soft}`));
    if (config.source === 'record' || config.recordBugMode !== 'off') {
      console.log(color(`Record tone: ${config.recordProfile}`, `${c.dim}${palette.soft}`));
      console.log(color(`FX family:  ${config.recordFamily}`, `${c.dim}${palette.soft}`));
      if (config.recordFamily === 'bug' || config.recordBugMode !== 'off') {
        console.log(color(`Bug mode:   ${config.recordBugMode}`, `${c.dim}${palette.soft}`));
      }
      if (config.source === 'record') {
        console.log(color(`Scratch:    ${config.recordScratch}`, `${c.dim}${palette.soft}`));
        console.log(color(`Wobble FX:  ${config.recordWavy}`, `${c.dim}${palette.soft}`));
      }
      console.log(color(`Intensity:  ${config.recordIntensity}`, `${c.dim}${palette.soft}`));
      console.log(color(`Mix:        ${config.recordMix}`, `${c.dim}${palette.soft}`));
      console.log(color(`Chaos:      ${config.recordChaos}`, `${c.dim}${palette.soft}`));
    }
    if (config.mode === 'backing' && config.source === 'generated') {
      console.log(
        color(
          `Backing:    drums ${config.backing.drums ? 'on' : 'off'}, bass ${config.backing.bass ? 'on' : 'off'}, metronome ${config.backing.metronome}`,
          `${c.dim}${palette.soft}`,
        ),
      );
      console.log(
        color(
          `Drum FX:    clap ${config.backing.clap ? 'on' : 'off'}, open hat ${config.backing.openHat ? 'on' : 'off'}, perc ${config.backing.perc ? 'on' : 'off'}`,
          `${c.dim}${palette.soft}`,
        ),
      );
      console.log(
        color(
          `Groove:     swing ${config.backing.swing}, gate ${config.backing.gate}, mutate ${config.backing.mutate}, deviate ${config.backing.deviate}`,
          `${c.dim}${palette.soft}`,
        ),
      );
    }
    console.log(color(`Theme:      ${config.theme}`, `${c.dim}${palette.soft}`));
    console.log(color(`Length:     ${config.length} notes`, `${c.dim}${palette.soft}`));
    console.log(color(`BPM:        ${config.bpm}`, `${c.dim}${palette.soft}`));
    console.log(color(`Seed source:${config.seedSource}`, `${c.dim}${palette.soft}`));
    if (config.seedSource === 'manual') {
      console.log(color(`Seed pitch: ${config.seedPitch}`, `${c.dim}${palette.soft}`));
    }
    console.log(color(`After export:${config.openAfterExport}`, `${c.dim}${palette.soft}`));
    console.log(color(`Export media:${config.exportAudio}`, `${c.dim}${palette.soft}`));
    console.log(color(`Export stems:${config.exportStems ? 'on' : 'off'}`, `${c.dim}${palette.soft}`));
    if (config.exportAudio === 'mp4') console.log(color('Cover image: ./src/assets/cover.png', `${c.dim}${palette.soft}`));
    console.log('');

    const next = (await selectPrompt({
      message: 'Continue',
      choices: [
        { value: 'start', name: 'Start generation' },
        { value: 'back', name: 'Back to setup' },
      ],
      default: 'start',
      theme: inquirerTheme,
    })) as 'start' | 'back';

    if (next === 'start') return config;
  }
}
