import type { InstrumentName } from './instrument';
import type { ProviderName } from './providers/factory';

export type CliConfig = {
  provider: ProviderName;
  instrument: InstrumentName;
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

type Option<T> = {
  value: T;
  label: string;
  help?: string;
};

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
  { value: 'none', label: 'MIDI only (.mid)', help: 'No extra audio/video export.' },
  { value: 'mp3', label: 'MIDI + MP3', help: 'Render audio from generated notes.' },
  { value: 'mp4', label: 'MIDI + MP4', help: 'Render video with static cover image + audio.' },
];

const INSTRUMENT_OPTIONS: Option<InstrumentName>[] = [
  { value: 'lead', label: 'Lead', help: 'Higher melodic line.' },
  { value: 'bass', label: 'Bass', help: 'Lower-end groove line.' },
  { value: 'pad', label: 'Pad', help: 'Smoother, wider note range.' },
  { value: 'keys', label: 'Keys', help: 'Mid register keyboard tone.' },
  { value: 'drums', label: 'Drums', help: 'Maps notes to drum hits (channel 10).' },
];

function recommendedProvider(defaultProvider: ProviderName): ProviderName {
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.GROQ_API_KEY) return 'groq';
  if (process.env.XAI_API_KEY) return 'grok';
  if (process.env.ANTHROPIC_API_KEY) return 'claude';
  return defaultProvider;
}

function providerOptions(): Option<ProviderName>[] {
  return [
    {
      value: 'mock',
      label: 'Demo mode (Mock)',
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
  if (normalized === '3' || normalized === 'claude') return 'claude';
  if (normalized === '4' || normalized === 'groq') return 'groq';
  if (normalized === '5' || normalized === 'grok' || normalized === 'xai') return 'grok';
  return null;
}

function section(title: string, subtitle?: string): void {
  console.log('');
  console.log(color(title, `${c.bold}${palette.primary}`));
  if (subtitle) console.log(color(subtitle, `${c.dim}${palette.soft}`));
}

async function ensureProviderCredentials(
  inputPrompt: (cfg: {
    message: string;
    default?: string;
    validate?: (value: string) => true | string;
  }) => Promise<string>,
  passwordPrompt: (cfg: {
    message: string;
    validate?: (value: string) => true | string;
  }) => Promise<string>,
  provider: ProviderName,
): Promise<boolean> {
  if (provider === 'mock') {
    console.log(color('Using demo mode (no API key needed).', `${c.dim}${palette.soft}`));
    return true;
  }

  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    console.log(color('OPENAI_API_KEY detected in environment.', `${c.dim}${palette.soft}`));
    return true;
  }
  if (provider === 'claude' && process.env.ANTHROPIC_API_KEY) {
    console.log(color('ANTHROPIC_API_KEY detected in environment.', `${c.dim}${palette.soft}`));
    return true;
  }
  if (provider === 'groq' && process.env.GROQ_API_KEY) {
    console.log(color('GROQ_API_KEY detected in environment.', `${c.dim}${palette.soft}`));
    return true;
  }
  if (provider === 'grok' && process.env.XAI_API_KEY) {
    console.log(color('XAI_API_KEY detected in environment.', `${c.dim}${palette.soft}`));
    return true;
  }

  const keyName = provider === 'openai'
    ? 'OPENAI_API_KEY'
    : provider === 'claude'
      ? 'ANTHROPIC_API_KEY'
      : provider === 'groq'
        ? 'GROQ_API_KEY'
        : 'XAI_API_KEY';
  console.log(color(`${keyName} is not set.`, c.yellow));
  console.log(color('Paste key for this session (not saved to disk).', c.dim));
  const key = await passwordPrompt({
    message: `${keyName}`,
    validate: (value) => (value.trim() ? true : 'Key is required'),
  });
  const trimmed = key.trim();
  if (!trimmed) {
    console.log(color('No key entered.', c.red));
    return false;
  }

  if (provider === 'openai') {
    process.env.OPENAI_API_KEY = trimmed;
  } else if (provider === 'claude') {
    process.env.ANTHROPIC_API_KEY = trimmed;
  } else if (provider === 'groq') {
    process.env.GROQ_API_KEY = trimmed;
  } else {
    process.env.XAI_API_KEY = trimmed;
  }
  console.log(color(`${keyName} received for this session.`, `${c.bold}${palette.primary}`));
  return true;
}

async function pickProvider(
  selectPrompt: (cfg: {
    message: string;
    default?: ProviderName;
    choices: Array<{ value: ProviderName; name: string; description?: string }>;
    theme?: unknown;
  }) => Promise<ProviderName>,
  inputPrompt: (cfg: {
    message: string;
    default?: string;
    validate?: (value: string) => true | string;
    theme?: unknown;
  }) => Promise<string>,
  passwordPrompt: (cfg: {
    message: string;
    validate?: (value: string) => true | string;
    theme?: unknown;
  }) => Promise<string>,
  fallback: ProviderName,
): Promise<ProviderName> {
  const recommended = recommendedProvider(fallback);
  const options = providerOptions();
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

  const ok = await ensureProviderCredentials(inputPrompt, passwordPrompt, selected);
  if (!ok) {
    const manual = await inputPrompt({
      message: 'Choose provider (mock/openai/claude/groq/grok)',
      default: recommended,
      validate: (value) => (parseProvider(value) ? true : 'Enter mock/openai/claude/groq/grok'),
      theme: inquirerTheme,
    });
    const parsed = parseProvider(manual);
    if (!parsed) return 'mock';
    const retried = await ensureProviderCredentials(inputPrompt, passwordPrompt, parsed);
    if (!retried) return 'mock';
    return parsed;
  }
  return selected;
}

async function pickTheme(
  selectPrompt: (cfg: {
    message: string;
    choices: Array<{ value: string; name: string; description?: string }>;
    theme?: unknown;
  }) => Promise<string>,
  inputPrompt: (cfg: {
    message: string;
    default?: string;
    validate?: (value: string) => true | string;
    theme?: unknown;
  }) => Promise<string>,
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
      validate: (value) => (value.trim() ? true : 'Theme is required'),
      theme: inquirerTheme,
    });
    return custom.trim() || fallback;
  }
  return selected;
}

async function pickLength(
  selectPrompt: (cfg: {
    message: string;
    choices: Array<{ value: number; name: string; description?: string }>;
    theme?: unknown;
  }) => Promise<number>,
  inputPrompt: (cfg: {
    message: string;
    default?: string;
    validate?: (value: string) => true | string;
    theme?: unknown;
  }) => Promise<string>,
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
      validate: (value) => (asPositiveInt(value, 0) > 0 ? true : 'Enter a positive number'),
      theme: inquirerTheme,
    });
    return asPositiveInt(custom, fallback);
  }
  return selected;
}

async function pickBpm(
  selectPrompt: (cfg: {
    message: string;
    choices: Array<{ value: number; name: string; description?: string }>;
    theme?: unknown;
  }) => Promise<number>,
  inputPrompt: (cfg: {
    message: string;
    default?: string;
    validate?: (value: string) => true | string;
    theme?: unknown;
  }) => Promise<string>,
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
      validate: (value) => (asPositiveInt(value, 0) > 0 ? true : 'Enter a positive number'),
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

  let selectPrompt: (cfg: {
    message: string;
    default?: string | number;
    choices: Array<{ value: string | number; name: string; description?: string }>;
    theme?: unknown;
  }) => Promise<string | number>;
  let inputPrompt: (cfg: {
    message: string;
    default?: string;
    validate?: (value: string) => true | string;
    theme?: unknown;
  }) => Promise<string>;
  let passwordPrompt: (cfg: {
    message: string;
    validate?: (value: string) => true | string;
    theme?: unknown;
  }) => Promise<string>;

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
    section('1) Provider', 'Pick model provider (demo mode is easiest to start).');
    const provider = (await pickProvider(
      (cfg) => selectPrompt(cfg) as Promise<ProviderName>,
      inputPrompt,
      passwordPrompt,
      defaults.provider,
    )) as ProviderName;

    section('2) Instrument', 'Choose instrument profile for output mapping.');
    const instrument = (await selectPrompt({
      message: 'Instrument',
      choices: INSTRUMENT_OPTIONS.map((option) => ({
        value: option.value,
        name: option.label,
        description: option.help,
      })),
      default: defaults.instrument,
      theme: inquirerTheme,
    })) as InstrumentName;

    section('3) Style', 'Choose a preset music category or custom theme.');
    const theme = await pickTheme((cfg) => selectPrompt(cfg) as Promise<string>, inputPrompt, defaults.theme);
    section('4) Structure', 'Set length and tempo.');
    const length = await pickLength(
      (cfg) => selectPrompt(cfg) as Promise<number>,
      inputPrompt,
      defaults.length,
    );
    const bpm = await pickBpm((cfg) => selectPrompt(cfg) as Promise<number>, inputPrompt, defaults.bpm);
    section('5) Input', 'Choose seed note input mode.');
    const seedSource = (await selectPrompt({
      message: 'Seed input mode',
      choices: SEED_SOURCE_OPTIONS.map((option) => ({
        value: option.value,
        name: option.label,
        description: option.help,
      })),
      default: defaults.seedSource,
      theme: inquirerTheme,
    })) as 'manual' | 'keyboard';

    let seedPitch = defaults.seedPitch;
    if (seedSource === 'manual') {
      const seedRaw = await inputPrompt({
        message: 'Seed pitch MIDI 0-127',
        default: String(defaults.seedPitch),
        validate: (value) => {
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

    section('6) Export Open Action', 'What should happen right after MIDI export?');
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

    section('7) Export Media Format', 'Optional extra export format when you choose export actions.');
    const exportAudio = (await selectPrompt({
      message: 'Export profile',
      choices: EXPORT_AUDIO_OPTIONS.map((option) => ({
        value: option.value,
        name: option.label,
        description: option.help,
      })),
      default: defaults.exportAudio,
      theme: inquirerTheme,
    })) as 'none' | 'mp3' | 'mp4';

    const config = {
      provider,
      instrument,
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
    console.log(color(`Instrument: ${config.instrument}`, `${c.dim}${palette.soft}`));
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
