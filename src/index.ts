#!/usr/bin/env node
import { dirname, extname, join, basename } from 'node:path';
import { unlink } from 'node:fs/promises';
import { exportSequenceToMidi } from './exportMidi.js';
import {
  exportSequenceToWav,
  exportWavToMp3,
  exportWavToMp4,
  isFfmpegMissing,
  processRecordedWav,
} from './exportAudio.js';
import {
  applyGrowthAndDuration,
  applyTimingFeel,
  buildBackingEvents,
  sequenceToEvents,
  transformMelody,
  type BackingControls,
  type GenerationMode,
  type GrowthStyle,
  type ModRate,
  type ModTarget,
  type NoteEvent,
  type PitchRange,
  type TimingFeel,
} from './arrangement.js';
import { applyFxToSequence, buildFxSettings, type DecayStyle, type FxPresetName, type FxSettings } from './fx.js';
import { applyInstrumentProfile, getInstrumentProfile, type InstrumentName } from './instrument.js';
import { promptCliConfig, type RuntimeMode } from './cli.js';
import { generateSequence } from './generator.js';
import { playSequenceToOutput, waitForSeedNote } from './midi.js';
import { openExportTarget, type OpenAfterExport } from './openExport.js';
import { buildProvider, type ProviderName } from './providers/factory.js';
import type { GeneratedNote } from './types.js';

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
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

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function pitchToName(pitch: number): string {
  const p = Math.max(0, Math.min(127, Math.round(pitch)));
  const octave = Math.floor(p / 12) - 1;
  return `${NOTE_NAMES[p % 12]}${octave}`;
}

function formatNotePreview(sequence: GeneratedNote[], limit = 16): string {
  const names = sequence.slice(0, limit).map((n) => pitchToName(n.pitch));
  const suffix = sequence.length > limit ? ' ...' : '';
  return `${names.join(' ')}${suffix}`;
}

function logKV(label: string, value: string | number): void {
  console.log(color(`${label} `, palette.soft) + color(String(value), palette.primary));
}

async function withSpinner<T>(message: string, task: Promise<T>): Promise<T> {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  process.stdout.write(`${color(frames[i], palette.primary)} ${color(message, palette.soft)}`);

  const timer = setInterval(() => {
    i = (i + 1) % frames.length;
    process.stdout.write(`\r${color(frames[i], palette.primary)} ${color(message, palette.soft)}`);
  }, 90);

  try {
    const result = await task;
    process.stdout.write(`\r${color('✓', palette.primary)} ${color(`${message} done`, palette.soft)}\n`);
    return result;
  } finally {
    clearInterval(timer);
  }
}

function arg(name: string, fallback: string): string {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.split('=').slice(1).join('=') : fallback;
}

function boolArg(name: string, fallback: boolean): boolean {
  const raw = arg(name, fallback ? 'true' : 'false').trim().toLowerCase();
  if (raw === 'true' || raw === '1' || raw === 'yes' || raw === 'on') return true;
  if (raw === 'false' || raw === '0' || raw === 'no' || raw === 'off') return false;
  return fallback;
}

function recordScratchArg(name: string, fallback: 'off' | 'texture' | 'dj'): 'off' | 'texture' | 'dj' {
  const raw = arg(name, fallback).trim().toLowerCase();
  if (raw === 'off' || raw === 'false' || raw === '0' || raw === 'no') return 'off';
  if (raw === 'texture' || raw === 'on' || raw === 'true' || raw === '1' || raw === 'yes') return 'texture';
  if (raw === 'dj' || raw === 'replay' || raw === 'scratch') return 'dj';
  return fallback;
}

function intArg(name: string, fallback: number, min: number, max: number): number {
  const raw = Number.parseInt(arg(name, String(fallback)), 10);
  if (!Number.isFinite(raw)) return fallback;
  return Math.max(min, Math.min(max, raw));
}

function floatArg(name: string, fallback: number, min: number, max: number): number {
  const raw = Number.parseFloat(arg(name, String(fallback)));
  if (!Number.isFinite(raw)) return fallback;
  return Math.max(min, Math.min(max, raw));
}

function runtimeArg(name: string, fallback: RuntimeMode): RuntimeMode {
  const raw = arg(name, fallback).trim().toLowerCase();
  return raw === 'web' ? 'web' : 'desktop';
}

function clampOpenAfterExportForRuntime(
  runtime: RuntimeMode,
  value: OpenAfterExport,
): OpenAfterExport {
  return runtime === 'web' ? 'none' : value;
}

function clampExportAudioForRuntime(
  runtime: RuntimeMode,
  value: 'none' | 'mp3' | 'mp4',
): 'none' | 'mp3' | 'mp4' {
  return runtime === 'web' ? 'none' : value;
}

function isWebRuntime(runtime: RuntimeMode): boolean {
  return runtime === 'web';
}

type PostRunAction = 'finish' | 'retry' | 'export-finish' | 'export-retry';

type StemGroups = {
  melody: NoteEvent[];
  bass: NoteEvent[];
  drums: NoteEvent[];
};

const inquirerTheme = {
  icon: {
    cursor: '❯',
  },
  style: {
    highlight: (text: string) => color(text, palette.primary),
    message: (text: string) => color(text, `${c.bold}${palette.soft}`),
    description: (text: string) => color(text, palette.soft),
    answer: (text: string) => color(text, palette.primary),
    defaultAnswer: (text: string) => color(text, palette.soft),
    help: (text: string) => color(text, palette.soft),
    key: (text: string) => color(text, palette.primary),
    error: (text: string) => color(text, palette.soft),
  },
};

function openActionLabel(openAfterExport: OpenAfterExport): string {
  if (openAfterExport === 'finder') return 'reveal in Finder';
  if (openAfterExport === 'garageband') return 'open in GarageBand';
  return 'do nothing after export';
}

async function promptPostRunAction(
  runtime: RuntimeMode,
  openAfterExport: OpenAfterExport,
  source: 'generated' | 'record',
): Promise<PostRunAction> {
  const inquirer = await import('@inquirer/prompts');
  const exportLabel = source === 'record' ? 'Export MIDI (record-player FX)' : 'Export MIDI';
  const exportActionLabel = isWebRuntime(runtime)
    ? exportLabel
    : `${exportLabel} + ${openActionLabel(openAfterExport)}`;
  const selection = await inquirer.select({
    message: isWebRuntime(runtime) ? 'Next action' : `Next action (export will ${openActionLabel(openAfterExport)})`,
    choices: [
      { value: 'export-finish', name: `${exportActionLabel} + finish` },
      { value: 'export-retry', name: `${exportActionLabel} + retry` },
      { value: 'retry', name: 'Retry (new take)' },
      { value: 'finish', name: 'Finish' },
    ],
    theme: inquirerTheme,
  });
  return selection as PostRunAction;
}

function defaultMidiPath(): string {
  const stamp = new Date().toISOString().replaceAll(':', '-').slice(0, 19);
  return `./exports/opennote-${stamp}.mid`;
}

async function maybeExportMidi(
  sequence: GeneratedNote[] | NoteEvent[],
  bpm: number,
  explicitPath: string | undefined,
  openAfterExport: OpenAfterExport,
  exportAudio: 'none' | 'mp3' | 'mp4',
  exportStems: boolean,
  stems: StemGroups,
  coverImagePath: string,
  fx: FxSettings,
  recordPlayerFx: {
    enabled: boolean;
    eqMode: 'balanced' | 'flat' | 'warm' | 'bright' | 'bass' | 'phone';
    profile: 'default' | 'vinyl' | 'dust';
    family: 'character' | 'motion' | 'space' | 'bug';
    bugMode: 'off' | 'pll-drift' | 'buffer-tear' | 'clock-bleed' | 'memory-rot' | 'crc-glitch';
    intensity: number;
    chaos: number;
    mix: number;
    scratch: 'off' | 'texture' | 'dj';
    wavy: number;
  },
): Promise<string | null> {
  const path = explicitPath ?? defaultMidiPath();
  const written = await exportSequenceToMidi(sequence, bpm, path);
  console.log(color('MIDI exported:', palette.soft), written);
  let openPath = written;

  if (exportStems) {
    const ext = extname(written).toLowerCase();
    const baseNoExt = ext === '.mid' || ext === '.midi'
      ? written.slice(0, -ext.length)
      : join(dirname(written), basename(written));
    if (stems.melody.length > 0) {
      const melodyPath = `${baseNoExt}-melody.mid`;
      await exportSequenceToMidi(stems.melody, bpm, melodyPath);
      console.log(color('Stem exported:', palette.soft), melodyPath);
    }
    if (stems.bass.length > 0) {
      const bassPath = `${baseNoExt}-bass.mid`;
      await exportSequenceToMidi(stems.bass, bpm, bassPath);
      console.log(color('Stem exported:', palette.soft), bassPath);
    }
    if (stems.drums.length > 0) {
      const drumsPath = `${baseNoExt}-drums.mid`;
      await exportSequenceToMidi(stems.drums, bpm, drumsPath);
      console.log(color('Stem exported:', palette.soft), drumsPath);
    }
  }

  if (exportAudio !== 'none') {
    try {
      const ext = extname(written).toLowerCase();
      const baseNoExt = ext === '.mid' || ext === '.midi'
        ? written.slice(0, -ext.length)
        : join(dirname(written), basename(written));
      const wavPath = `${baseNoExt}.__temp.wav`;
      const writtenWav = await exportSequenceToWav(sequence, wavPath, fx);
      let renderWav = writtenWav;
      let processedWav: string | null = null;

      const shouldProcess = recordPlayerFx.enabled && (
        recordPlayerFx.eqMode !== 'flat'
        || recordPlayerFx.profile !== 'default'
        || recordPlayerFx.family !== 'character'
        || recordPlayerFx.bugMode !== 'off'
        || recordPlayerFx.scratch !== 'off'
        || recordPlayerFx.wavy > 0
        || recordPlayerFx.intensity > 0
        || recordPlayerFx.mix > 0
        || recordPlayerFx.chaos > 0
      );
      if (shouldProcess) {
        try {
          processedWav = `${baseNoExt}.__recordfx.wav`;
          renderWav = await processRecordedWav(writtenWav, processedWav, {
            eqMode: recordPlayerFx.eqMode,
            profile: recordPlayerFx.profile,
            family: recordPlayerFx.family,
            bugMode: recordPlayerFx.bugMode,
            intensity: recordPlayerFx.intensity,
            chaos: recordPlayerFx.chaos,
            mix: recordPlayerFx.mix,
            scratch: recordPlayerFx.scratch,
            wavy: recordPlayerFx.wavy,
          });
        } catch (fxErr) {
          processedWav = null;
          renderWav = writtenWav;
          console.error(color('Record-player FX failed; exporting without FX.', palette.soft));
          console.error(fxErr);
        }
      }

      if (exportAudio === 'mp3') {
        const mp3Path = `${baseNoExt}.mp3`;
        const writtenMp3 = await exportWavToMp3(renderWav, mp3Path);
        console.log(color('MP3 exported:', palette.soft), writtenMp3);
        openPath = writtenMp3;
      } else {
        const mp4Path = `${baseNoExt}.mp4`;
        const writtenMp4 = await exportWavToMp4(renderWav, mp4Path, coverImagePath);
        console.log(color('MP4 exported:', palette.soft), writtenMp4);
        openPath = writtenMp4;
      }

      try {
        await unlink(writtenWav);
      } catch {
        // Ignore temp cleanup errors.
      }
      if (processedWav) {
        try {
          await unlink(processedWav);
        } catch {
          // Ignore temp cleanup errors.
        }
      }
    } catch (err) {
      if (isFfmpegMissing(err)) {
        console.error(color('ffmpeg not found: MP3/MP4 export skipped.', palette.soft));
        console.error(color('Install hint (macOS): brew install ffmpeg', palette.soft));
      } else {
        throw err;
      }
    }
  }

  if (openAfterExport !== 'none') {
    try {
      await openExportTarget(openPath, openAfterExport);
      console.log(color('Opened:', palette.soft), openAfterExport);
    } catch (err) {
      console.error(color(`Failed to open (${openAfterExport}):`, palette.soft), err);
    }
  }
  return written;
}

function printHelp(): void {
  console.log(color('OpenNote CLI', `${c.bold}${palette.primary}`));
  console.log(`
Interactive mode (recommended):
  npm run note

Non-interactive mode:
  npm run note -- --no-interactive --provider=mock --theme="ambient" --length=16 --bpm=120 --seed=60

Flags:
  --runtime=desktop|web
  --provider=mock|openai|gemini|claude|groq|grok
  --source=generated|record
  --instrument=lead|bass|pad|keys|drums
  --fx=clean|dark|grime|lush|punch
  --decay=tight|balanced|long
  --mode=single|backing
  --transpose=-12..12
  --pitch-range=low|mid|high
  --snap-scale=true|false
  --mod-rate=off|slow|med|fast
  --mod-depth=0..100
  --mod-target=velocity|duration|pitch
  --growth=flat|build
  --duration-stretch=1..4
  --timing-feel=tight|human|offbeat|loose
  --timing-amount=0..100
  --backing-drums=true|false
  --backing-bass=true|false
  --backing-clap=true|false
  --backing-open-hat=true|false
  --backing-perc=true|false
  --metronome=off|count-in|always
  --swing=0..100
  --gate=tight|balanced|long
  --mutate=0..100
  --deviate=0..100
  --theme="<style prompt>"
  --length=<notes>
  --bpm=<tempo>
  --seed=<midi pitch 0-127>
  --seed-source=keyboard|manual
  --beep=true|false
  --export-midi=<path.mid>
  --open-after-export=none|finder|garageband
  --export-audio=none|mp3|mp4
  --export-stems=true|false
  --eq-mode=balanced|flat|warm|bright|bass|phone
  --record-profile=default|vinyl|dust
  --record-family=character|motion|space|bug
  --record-bug-mode=off|pll-drift|buffer-tear|clock-bleed|memory-rot|crc-glitch
  --record-intensity=0..100
  --record-chaos=0..100
  --record-mix=0..100
  --record-scratch=off|texture|dj
  --record-wavy=0..100
  --no-interactive
  --help

Provider keys:
  OPENAI_API_KEY for openai
  GEMINI_API_KEY for gemini
  ANTHROPIC_API_KEY for claude
  GROQ_API_KEY for groq
  XAI_API_KEY for grok
In interactive mode, if key is missing you can paste it at prompt for the current session.

Keyboard seed mode:
  1-8 = notes in scale
  Shift+1-8 = sharp notes
  +/- = octave up/down
`);
}

async function main() {
  if (process.argv.includes('--help')) {
    printHelp();
    return;
  }

  const interactive = !process.argv.includes('--no-interactive');
  const exportPathFlag = process.argv.find((a) => a.startsWith('--export-midi='))?.split('=').slice(1).join('=');
  const runtime = runtimeArg('runtime', 'desktop');
  const mode = arg('mode', 'single') as GenerationMode;
  const backing: BackingControls = {
    drums: boolArg('backing-drums', mode === 'backing'),
    bass: boolArg('backing-bass', false),
    clap: boolArg('backing-clap', false),
    openHat: boolArg('backing-open-hat', false),
    perc: boolArg('backing-perc', false),
    metronome: arg('metronome', mode === 'backing' ? 'count-in' : 'off') as BackingControls['metronome'],
    swing: intArg('swing', 0, 0, 100),
    gate: arg('gate', 'balanced') as BackingControls['gate'],
    mutate: intArg('mutate', 0, 0, 100),
    deviate: intArg('deviate', 0, 0, 100),
  };
  const defaults = {
    runtime,
    provider: arg('provider', 'mock') as ProviderName,
    providerAuth: (arg('provider', 'mock') === 'mock' ? 'none' : 'env') as 'none' | 'env' | 'session',
    source: arg('source', 'generated') as 'generated' | 'record',
    mode,
    instrument: arg('instrument', 'lead') as InstrumentName,
    fxPreset: arg('fx', 'clean') as FxPresetName,
    decayStyle: arg('decay', 'balanced') as DecayStyle,
    transpose: intArg('transpose', 0, -12, 12),
    pitchRange: arg('pitch-range', 'mid') as PitchRange,
    snapScale: boolArg('snap-scale', false),
    modRate: arg('mod-rate', 'off') as ModRate,
    modDepth: intArg('mod-depth', 0, 0, 100),
    modTarget: arg('mod-target', 'velocity') as ModTarget,
    growthStyle: arg('growth', 'flat') as GrowthStyle,
    durationStretch: floatArg('duration-stretch', 1, 1, 4),
    timingFeel: arg('timing-feel', 'tight') as TimingFeel,
    timingAmount: intArg('timing-amount', 0, 0, 100),
    backing,
    theme: arg('theme', 'dark ambient techno'),
    length: intArg('length', 16, 1, 512),
    bpm: intArg('bpm', 120, 1, 400),
    seedPitch: intArg('seed', 60, 0, 127),
    seedSource: (arg('seed-source', 'keyboard') as 'manual' | 'keyboard'),
    beep: boolArg('beep', false),
    openAfterExport: clampOpenAfterExportForRuntime(runtime, arg('open-after-export', 'finder') as OpenAfterExport),
    exportAudio: clampExportAudioForRuntime(runtime, arg('export-audio', 'none') as 'none' | 'mp3' | 'mp4'),
    exportStems: boolArg('export-stems', arg('export-audio', 'none') !== 'none'),
    eqMode: (arg('eq-mode', 'balanced') as 'balanced' | 'flat' | 'warm' | 'bright' | 'bass' | 'phone'),
    recordDevice: '',
    recordSeconds: 8,
    recordMonitor: false,
    recordProfile: (arg('record-profile', 'default') as 'default' | 'vinyl' | 'dust'),
    recordFamily: (arg('record-family', 'character') as 'character' | 'motion' | 'space' | 'bug'),
    recordBugMode: (
      arg('record-bug-mode', 'off') as 'off' | 'pll-drift' | 'buffer-tear' | 'clock-bleed' | 'memory-rot' | 'crc-glitch'
    ),
    recordIntensity: intArg('record-intensity', 45, 0, 100),
    recordChaos: intArg('record-chaos', 25, 0, 100),
    recordMix: intArg('record-mix', 40, 0, 100),
    recordScratch: recordScratchArg('record-scratch', 'off'),
    recordWavy: intArg('record-wavy', 0, 0, 100),
  };

  const config = interactive ? await promptCliConfig(defaults) : defaults;
  const provider = buildProvider(config.provider);
  let keepRunning = true;
  while (keepRunning) {
    const seedPitch =
      config.seedSource === 'keyboard' ? (await waitForSeedNote({ baseOctave: 4 })).pitch : config.seedPitch;

    const sequence = await withSpinner(
      `Generating ${config.length} notes`,
      generateSequence(provider, seedPitch, {
        theme: config.theme,
        targetLength: config.length,
        bpm: config.bpm,
      }),
    );
    const transformedSequence = transformMelody(
      sequence,
      {
        transpose: config.transpose,
        range: config.pitchRange,
        snapScale: config.snapScale,
      },
      {
        rate: config.modRate,
        depth: config.modDepth,
        target: config.modTarget,
      },
      config.backing,
    );
    const arrangedSequence = applyGrowthAndDuration(
      transformedSequence,
      config.growthStyle,
      config.durationStretch,
    );
    const fxSettings = buildFxSettings(config.fxPreset, config.decayStyle);
    const fxSequence = applyFxToSequence(arrangedSequence, fxSettings);
    const instrumentSequence = applyInstrumentProfile(fxSequence, config.instrument);
    const instrumentProfile = getInstrumentProfile(config.instrument);
    const melodyEvents = sequenceToEvents(instrumentSequence, instrumentProfile.midiChannel);
    const backingEvents = config.mode === 'backing'
      ? buildBackingEvents(melodyEvents, config.theme, config.bpm, config.backing, config.growthStyle)
      : [];
    const stemGroups: StemGroups = {
      melody: melodyEvents,
      bass: backingEvents.filter((e) => e.channel === 1),
      drums: backingEvents.filter((e) => e.channel === 9),
    };
    const mergedEvents = [...melodyEvents, ...backingEvents].sort((a, b) => a.startMs - b.startMs);
    const playbackEvents = applyTimingFeel(mergedEvents, config.bpm, config.timingFeel, config.timingAmount);

    console.log(color('Session', `${c.bold}${palette.primary}`));
    logKV('Source:', config.source === 'record' ? 'record-player' : 'generated');
    logKV('Provider:', config.provider);
    logKV('Auth:', config.providerAuth);
    logKV('Mode:', config.mode);
    logKV('Instrument:', `${instrumentProfile.label} (ch ${instrumentProfile.midiChannel + 1}, program ${instrumentProfile.program})`);
    logKV('FX:', `${config.fxPreset} / ${config.decayStyle}`);
    logKV('Pitch:', `transpose ${config.transpose}, range ${config.pitchRange}, snap ${config.snapScale ? 'on' : 'off'}`);
    logKV('Modulate:', `${config.modRate} depth ${config.modDepth} target ${config.modTarget}`);
    logKV('Growth:', config.growthStyle);
    logKV('Duration:', `${config.durationStretch}x`);
    logKV('Timing:', `${config.timingFeel} (${config.timingAmount})`);
    logKV('Export stems:', config.exportStems ? 'on' : 'off');
    if (config.source === 'record' || config.recordBugMode !== 'off') {
      logKV(
        'Record FX:',
        `eq ${config.eqMode}, ${config.recordProfile}/${config.recordFamily}, bug ${config.recordBugMode}, scratch ${config.recordScratch}, wobble ${config.recordWavy}, intensity ${config.recordIntensity}, mix ${config.recordMix}, chaos ${config.recordChaos}`,
      );
    }
    if (config.mode === 'backing') {
      logKV('Backing:', `drums ${config.backing.drums ? 'on' : 'off'}, bass ${config.backing.bass ? 'on' : 'off'}, metronome ${config.backing.metronome}`);
      logKV('Drum FX:', `clap ${config.backing.clap ? 'on' : 'off'}, open hat ${config.backing.openHat ? 'on' : 'off'}, perc ${config.backing.perc ? 'on' : 'off'}`);
      logKV('Groove:', `swing ${config.backing.swing}, gate ${config.backing.gate}, mutate ${config.backing.mutate}, deviate ${config.backing.deviate}`);
    }
    logKV('Theme:', config.theme);
    logKV('Seed source:', config.seedSource);
    logKV('Seed pitch:', seedPitch);
    logKV('Generated notes:', `${instrumentSequence.length} notes`);
    logKV('Preview:', formatNotePreview(instrumentSequence));

    await playSequenceToOutput(playbackEvents, {
      beep: config.beep,
      instrument: instrumentProfile,
      metronome: config.backing.metronome,
      bpm: config.bpm,
    });

    if (exportPathFlag && !interactive) {
      await maybeExportMidi(
        playbackEvents,
        config.bpm,
        exportPathFlag,
        config.openAfterExport,
        config.exportAudio,
        config.exportStems,
        stemGroups,
        './src/assets/cover.png',
        fxSettings,
        {
          enabled: config.source === 'record' || config.recordBugMode !== 'off',
          eqMode: config.eqMode,
          profile: config.recordProfile,
          family: config.recordFamily,
          bugMode: config.recordBugMode,
          intensity: config.recordIntensity,
          chaos: config.recordChaos,
          mix: config.recordMix,
          scratch: config.recordScratch,
          wavy: config.recordWavy,
        },
      );
      break;
    }

    if (!interactive) break;

    const action = await promptPostRunAction(config.runtime, config.openAfterExport, config.source);
    if (action === 'finish') {
      keepRunning = false;
      continue;
    }

    if (action === 'retry') {
      continue;
    }

    if (action === 'export-finish') {
      await maybeExportMidi(
        playbackEvents,
        config.bpm,
        undefined,
        config.openAfterExport,
        config.exportAudio,
        config.exportStems,
        stemGroups,
        './src/assets/cover.png',
        fxSettings,
        {
          enabled: config.source === 'record' || config.recordBugMode !== 'off',
          eqMode: config.eqMode,
          profile: config.recordProfile,
          family: config.recordFamily,
          bugMode: config.recordBugMode,
          intensity: config.recordIntensity,
          chaos: config.recordChaos,
          mix: config.recordMix,
          scratch: config.recordScratch,
          wavy: config.recordWavy,
        },
      );
      keepRunning = false;
      continue;
    }

    await maybeExportMidi(
      playbackEvents,
      config.bpm,
      undefined,
      config.openAfterExport,
      config.exportAudio,
      config.exportStems,
      stemGroups,
      './src/assets/cover.png',
      fxSettings,
      {
        enabled: config.source === 'record' || config.recordBugMode !== 'off',
        eqMode: config.eqMode,
        profile: config.recordProfile,
        family: config.recordFamily,
        bugMode: config.recordBugMode,
        intensity: config.recordIntensity,
        chaos: config.recordChaos,
        mix: config.recordMix,
        scratch: config.recordScratch,
        wavy: config.recordWavy,
      },
    );
  }

  console.log(color('Finished.', `${c.bold}${palette.primary}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
