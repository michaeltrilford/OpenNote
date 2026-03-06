import type { InstrumentName } from './instrument';
import type {
  BackingControls,
  GenerationMode,
  GateStyle,
  GrowthStyle,
  MetronomeMode,
  ModRate,
  ModTarget,
  PitchRange,
} from './arrangement';
import type { DecayStyle, FxPresetName } from './fx';
import type { ProviderName } from './providers/factory';

export type CliConfig = {
  provider: ProviderName;
  providerAuth: 'none' | 'env' | 'session';
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
  backing: BackingControls;
  theme: string;
  length: number;
  bpm: number;
  seedPitch: number;
  seedSource: 'manual' | 'keyboard';
  beep: boolean;
  openAfterExport: 'none' | 'finder' | 'garageband';
  exportAudio: 'none' | 'mp3' | 'mp4';
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

const EXPORT_AUDIO_OPTIONS: Option<'none' | 'mp3' | 'mp4'>[] = [
  { value: 'mp4', label: 'MIDI + MP4', help: 'Render video with static cover image + audio.' },
  { value: 'mp3', label: 'MIDI + MP3', help: 'Render audio from generated notes.' },
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

const SETUP_PATH_OPTIONS: Option<SetupPath>[] = [
  { value: 'basic', label: 'Basic', help: 'Fast setup using default pitch/mod/backing values.' },
  { value: 'surprise', label: 'Surprise me', help: 'Auto-pick presets and controls from your style.' },
  { value: 'advanced', label: 'Advanced', help: 'Full control over pitch, modulation, and groove.' },
];

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function surprisePreset(theme: string): {
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
  backing: BackingControls;
} {
  const t = theme.toLowerCase();
  const isAmbient = t.includes('ambient') || t.includes('cinematic');
  const isTrap = t.includes('trap');
  const isTech = t.includes('techno') || t.includes('house') || t.includes('industrial');
  const mode: GenerationMode = isAmbient ? 'single' : Math.random() < 0.6 ? 'backing' : 'single';
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

  const transpose = Math.floor(Math.random() * 11) - 5;
  const pitchRange = instrument === 'bass'
    ? 'low'
    : instrument === 'pad'
      ? pickOne<PitchRange>(['mid', 'high'])
      : pickOne<PitchRange>(['low', 'mid', 'high']);
  const snapScale = Math.random() < (isTrap ? 0.4 : 0.7);
  const modRate = pickOne<ModRate>(['off', 'slow', 'med', 'fast']);
  const modDepth = modRate === 'off' ? 0 : Math.floor(Math.random() * 51);
  const modTarget = pickOne<ModTarget>(['velocity', 'duration', 'pitch']);
  const growthStyle: GrowthStyle = Math.random() < 0.65 ? 'build' : 'flat';
  const durationStretch = pickOne([1, 1.25, 1.5, 2]);

  const backing: BackingControls = mode === 'backing'
    ? {
        drums: true,
        bass: Math.random() < 0.7,
        clap: Math.random() < 0.6,
        openHat: Math.random() < 0.55,
        perc: Math.random() < 0.45,
        metronome: Math.random() < 0.5 ? 'count-in' : 'off',
        swing: isTech ? Math.floor(Math.random() * 24) : Math.floor(Math.random() * 16),
        gate: pickOne<GateStyle>(['tight', 'balanced', 'long']),
        mutate: Math.floor(Math.random() * 22),
        deviate: Math.floor(Math.random() * 20),
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

  return {
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
    backing,
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
      const theme = surpriseTheme();
      const picked = surprisePreset(theme);
      const config: CliConfig = {
        provider,
        providerAuth,
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
        backing: picked.backing,
        theme,
        length: surpriseLength(),
        bpm: surpriseBpm(theme),
        seedPitch: surpriseSeed(),
        seedSource: 'manual',
        beep: false,
        openAfterExport: defaults.openAfterExport,
        exportAudio: defaults.exportAudio === 'none' ? 'mp4' : defaults.exportAudio,
      };

      section('Surprise Setup', 'Auto-picked configuration. Starting generation now.');
      console.log(color(`Theme:      ${config.theme}`, `${c.dim}${palette.soft}`));
      console.log(color(`Mode:       ${config.mode}`, `${c.dim}${palette.soft}`));
      console.log(color(`Instrument: ${config.instrument}`, `${c.dim}${palette.soft}`));
      console.log(color(`FX:         ${config.fxPreset} / ${config.decayStyle}`, `${c.dim}${palette.soft}`));
      console.log(color(`Length/BPM: ${config.length} / ${config.bpm}`, `${c.dim}${palette.soft}`));
      console.log(color(`Seed pitch: ${config.seedPitch}`, `${c.dim}${palette.soft}`));
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
      const seedRaw = await inputPrompt({
        message: 'Seed pitch MIDI 0-127',
        default: String(defaults.seedPitch),
        validate: (value: string) => {
          const parsed = Number.parseInt(value, 10);
          if (!Number.isFinite(parsed)) return 'Enter a number';
          if (parsed < 0 || parsed > 127) return 'Must be 0..127';
          return true;
        },
        theme: inquirerTheme,
      });
      const seedPitch = asMidiPitch(seedRaw.trim(), defaults.seedPitch);

      const config: CliConfig = {
        provider,
        providerAuth,
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
        openAfterExport: 'finder',
        exportAudio: 'mp4',
      };

      section('Basic Setup', 'Using quick defaults. Starting generation now.');
      console.log(color(`Theme:      ${config.theme}`, `${c.dim}${palette.soft}`));
      console.log(color(`Length/BPM: ${config.length} / ${config.bpm}`, `${c.dim}${palette.soft}`));
      console.log(color(`Seed pitch: ${config.seedPitch}`, `${c.dim}${palette.soft}`));
      console.log(color(`Export:     ${config.exportAudio} + ${config.openAfterExport}`, `${c.dim}${palette.soft}`));
      console.log('');
      return config;
    }

    let mode = defaults.mode;
    let instrument = defaults.instrument;
    let fxPreset = defaults.fxPreset;
    let decayStyle = defaults.decayStyle;

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

    section('5) FX', 'Choose tone shaping profile and decay behavior.');
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

    let transpose = defaults.transpose;
    let pitchRange = defaults.pitchRange;
    let snapScale = defaults.snapScale;
    let modRate = defaults.modRate;
    let modDepth = defaults.modDepth;
    let modTarget = defaults.modTarget;
    let growthStyle = defaults.growthStyle;
    let durationStretch = defaults.durationStretch;
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
      section('6) Pitch', 'Transpose and range controls with optional scale snap.');
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

      section('7) Modulate', 'Add movement to velocity, duration, or pitch.');
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

      const modDepthRaw = await inputPrompt({
        message: 'Modulation depth (0..100)',
        default: String(defaults.modDepth),
        validate: (value: string) => {
          const parsed = Number.parseInt(value, 10);
          if (!Number.isFinite(parsed)) return 'Enter a number';
          if (parsed < 0 || parsed > 100) return 'Must be 0..100';
          return true;
        },
        theme: inquirerTheme,
      });
      modDepth = asBoundedInt(modDepthRaw, defaults.modDepth, 0, 100);

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

      section('8) Movement', 'Control song growth over time and overall note length.');
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

      if (mode === 'backing') {
        section('9) Backing', 'Enable drums/bass and shape groove behavior.');
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

        const swingRaw = await inputPrompt({
          message: 'Swing (0..100)',
          default: String(defaults.backing.swing),
          validate: (value: string) => {
            const parsed = Number.parseInt(value, 10);
            if (!Number.isFinite(parsed)) return 'Enter a number';
            if (parsed < 0 || parsed > 100) return 'Must be 0..100';
            return true;
          },
          theme: inquirerTheme,
        });
        const mutateRaw = await inputPrompt({
          message: 'Mutate (0..100)',
          default: String(defaults.backing.mutate),
          validate: (value: string) => {
            const parsed = Number.parseInt(value, 10);
            if (!Number.isFinite(parsed)) return 'Enter a number';
            if (parsed < 0 || parsed > 100) return 'Must be 0..100';
            return true;
          },
          theme: inquirerTheme,
        });
        const deviateRaw = await inputPrompt({
          message: 'Deviate (0..100)',
          default: String(defaults.backing.deviate),
          validate: (value: string) => {
            const parsed = Number.parseInt(value, 10);
            if (!Number.isFinite(parsed)) return 'Enter a number';
            if (parsed < 0 || parsed > 100) return 'Must be 0..100';
            return true;
          },
          theme: inquirerTheme,
        });

        backing = {
          drums: drumsRaw === 'on',
          bass: bassRaw === 'on',
          clap: clapRaw === 'on',
          openHat: openHatRaw === 'on',
          perc: percRaw === 'on',
          metronome,
          swing: asBoundedInt(swingRaw, defaults.backing.swing, 0, 100),
          gate,
          mutate: asBoundedInt(mutateRaw, defaults.backing.mutate, 0, 100),
          deviate: asBoundedInt(deviateRaw, defaults.backing.deviate, 0, 100),
        };
      }
    }

    section('9) Style', 'Choose a preset music category or custom theme.');
    const theme = await pickTheme((cfg) => selectPrompt(cfg) as Promise<string>, inputPrompt, defaults.theme);
    section('10) Structure', 'Set length and tempo.');
    const length = await pickLength(
      (cfg) => selectPrompt(cfg) as Promise<number>,
      inputPrompt,
      defaults.length,
    );
    const bpm = await pickBpm((cfg) => selectPrompt(cfg) as Promise<number>, inputPrompt, defaults.bpm);
    section('11) Input', setupPath === 'advanced' ? 'Choose seed note input mode.' : 'Basic path uses manual seed input.');
    const seedSource = setupPath === 'advanced'
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
    if (seedSource === 'manual') {
      const seedRaw = await inputPrompt({
        message: 'Seed pitch MIDI 0-127',
        default: String(defaults.seedPitch),
        validate: (value: string) => {
          const parsed = Number.parseInt(value, 10);
          if (!Number.isFinite(parsed)) return 'Enter a number';
          if (parsed < 0 || parsed > 127) return 'Must be 0..127';
          return true;
        },
        theme: inquirerTheme,
      });
      seedPitch = asMidiPitch(seedRaw.trim(), defaults.seedPitch);
    }

    const beep = false;

    section('12) Export Open Action', 'What should happen right after MIDI export?');
    const openAfterExport = (await selectPrompt({
      message: 'After export',
      choices: OPEN_AFTER_EXPORT_OPTIONS.map((option) => ({
        value: option.value,
        name: option.label,
        description: option.help,
      })),
      default: defaults.openAfterExport,
      theme: inquirerTheme,
    })) as 'none' | 'finder' | 'garageband';

    section('13) Export Media Format', 'Optional extra export format when you choose export actions.');
    const exportAudio = (await selectPrompt({
      message: 'Export profile',
      choices: EXPORT_AUDIO_OPTIONS.map((option) => ({
        value: option.value,
        name: option.label,
        description: option.help,
      })),
      default: defaults.exportAudio === 'none' ? 'mp4' : defaults.exportAudio,
      theme: inquirerTheme,
    })) as 'none' | 'mp3' | 'mp4';

    const config = {
      provider,
      providerAuth,
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
      backing,
      theme,
      length,
      bpm,
      seedPitch,
      seedSource,
      beep,
      openAfterExport,
      exportAudio,
    };

    section('Summary');
    console.log(color(`Provider:   ${config.provider}`, `${c.dim}${palette.soft}`));
    console.log(color(`Auth:       ${config.providerAuth}`, `${c.dim}${palette.soft}`));
    console.log(color(`Path:       ${setupPath}`, `${c.dim}${palette.soft}`));
    console.log(color(`Mode:       ${config.mode}`, `${c.dim}${palette.soft}`));
    console.log(color(`Instrument: ${config.instrument}`, `${c.dim}${palette.soft}`));
    console.log(color(`FX preset:  ${config.fxPreset}`, `${c.dim}${palette.soft}`));
    console.log(color(`Decay:      ${config.decayStyle}`, `${c.dim}${palette.soft}`));
    console.log(color(`Pitch:      transpose ${config.transpose}, range ${config.pitchRange}, snap ${config.snapScale ? 'on' : 'off'}`, `${c.dim}${palette.soft}`));
    console.log(color(`Modulate:   ${config.modRate} depth ${config.modDepth} target ${config.modTarget}`, `${c.dim}${palette.soft}`));
    console.log(color(`Growth:     ${config.growthStyle}`, `${c.dim}${palette.soft}`));
    console.log(color(`Duration:   ${config.durationStretch}x`, `${c.dim}${palette.soft}`));
    if (config.mode === 'backing') {
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
