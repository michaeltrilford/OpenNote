import { dirname, extname, join, basename } from 'node:path';
import { unlink } from 'node:fs/promises';
import { exportSequenceToMidi } from './exportMidi';
import { exportSequenceToWav, exportWavToMp3, exportWavToMp4, isFfmpegMissing } from './exportAudio';
import { promptCliConfig } from './cli';
import { generateSequence } from './generator';
import { playSequenceToOutput, waitForSeedNote } from './midi';
import { openExportTarget, type OpenAfterExport } from './openExport';
import { buildProvider, type ProviderName } from './providers/factory';
import type { GeneratedNote } from './types';

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

function arg(name: string, fallback: string): string {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.split('=').slice(1).join('=') : fallback;
}

type PostRunAction = 'finish' | 'retry' | 'export-finish' | 'export-retry';

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

async function promptPostRunAction(openAfterExport: OpenAfterExport): Promise<PostRunAction> {
  const inquirer = await import('@inquirer/prompts');
  const selection = await inquirer.select({
    message: `Next action (export will ${openActionLabel(openAfterExport)})`,
    choices: [
      { value: 'export-finish', name: `Export MIDI + ${openActionLabel(openAfterExport)} + finish` },
      { value: 'export-retry', name: `Export MIDI + ${openActionLabel(openAfterExport)} + retry` },
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
  sequence: GeneratedNote[],
  bpm: number,
  explicitPath: string | undefined,
  openAfterExport: OpenAfterExport,
  exportAudio: 'none' | 'mp3' | 'mp4',
  coverImagePath: string,
): Promise<string | null> {
  const path = explicitPath ?? defaultMidiPath();
  const written = await exportSequenceToMidi(sequence, bpm, path);
  console.log(color('MIDI exported:', palette.soft), written);
  let openPath = written;

  if (exportAudio !== 'none') {
    try {
      const ext = extname(written).toLowerCase();
      const baseNoExt = ext === '.mid' || ext === '.midi'
        ? written.slice(0, -ext.length)
        : join(dirname(written), basename(written));
      const wavPath = `${baseNoExt}.__temp.wav`;
      const writtenWav = await exportSequenceToWav(sequence, wavPath);

      if (exportAudio === 'mp3') {
        const mp3Path = `${baseNoExt}.mp3`;
        const writtenMp3 = await exportWavToMp3(writtenWav, mp3Path);
        console.log(color('MP3 exported:', palette.soft), writtenMp3);
        openPath = writtenMp3;
      } else {
        const mp4Path = `${baseNoExt}.mp4`;
        const writtenMp4 = await exportWavToMp4(writtenWav, mp4Path, coverImagePath);
        console.log(color('MP4 exported:', palette.soft), writtenMp4);
        openPath = writtenMp4;
      }

      try {
        await unlink(writtenWav);
      } catch {
        // Ignore temp cleanup errors.
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
  --provider=mock|openai|claude|groq|grok
  --theme="<style prompt>"
  --length=<notes>
  --bpm=<tempo>
  --seed=<midi pitch 0-127>
  --seed-source=keyboard|manual
  --beep=true|false
  --export-midi=<path.mid>
  --open-after-export=none|finder|garageband
  --export-audio=none|mp3|mp4
  --no-interactive
  --help

Provider keys:
  OPENAI_API_KEY for openai
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
  const exportMidiFlag = process.argv.find((a) => a.startsWith('--export-midi='))?.split('=').slice(1).join('=');
  const defaults = {
    provider: arg('provider', 'mock') as ProviderName,
    theme: arg('theme', 'dark ambient techno'),
    length: Number(arg('length', '16')),
    bpm: Number(arg('bpm', '120')),
    seedPitch: Number(arg('seed', '60')),
    seedSource: (arg('seed-source', 'keyboard') as 'manual' | 'keyboard'),
    beep: arg('beep', 'false') === 'true',
    openAfterExport: (arg('open-after-export', 'finder') as OpenAfterExport),
    exportAudio: (arg('export-audio', 'none') as 'none' | 'mp3' | 'mp4'),
  };

  const config = interactive
    ? await promptCliConfig(defaults)
    : {
        provider: defaults.provider,
        theme: defaults.theme,
        length: defaults.length,
        bpm: defaults.bpm,
        seedPitch: defaults.seedPitch,
        seedSource: defaults.seedSource,
        beep: defaults.beep,
        openAfterExport: defaults.openAfterExport,
        exportAudio: defaults.exportAudio,
      };

  const provider = buildProvider(config.provider);
  let keepRunning = true;
  while (keepRunning) {
    const seedPitch =
      config.seedSource === 'keyboard' ? (await waitForSeedNote({ baseOctave: 4 })).pitch : config.seedPitch;

    const sequence = await generateSequence(provider, seedPitch, {
      theme: config.theme,
      targetLength: config.length,
      bpm: config.bpm,
    });

    console.log(color('Session', `${c.bold}${palette.primary}`));
    logKV('Provider:', config.provider);
    logKV('Theme:', config.theme);
    logKV('Seed source:', config.seedSource);
    logKV('Seed pitch:', seedPitch);
    logKV('Generated notes:', `${sequence.length} notes`);
    logKV('Preview:', formatNotePreview(sequence));

    await playSequenceToOutput(sequence, { beep: config.beep });

    if (exportMidiFlag && !interactive) {
      await maybeExportMidi(
        sequence,
        config.bpm,
        exportMidiFlag,
        config.openAfterExport,
        config.exportAudio,
        './src/assets/cover.png',
      );
      break;
    }

    if (!interactive) break;

    const action = await promptPostRunAction(config.openAfterExport);
    if (action === 'finish') {
      keepRunning = false;
      continue;
    }

    if (action === 'retry') {
      continue;
    }

    if (action === 'export-finish') {
      await maybeExportMidi(
        sequence,
        config.bpm,
        undefined,
        config.openAfterExport,
        config.exportAudio,
        './src/assets/cover.png',
      );
      keepRunning = false;
      continue;
    }

    await maybeExportMidi(
      sequence,
      config.bpm,
      undefined,
      config.openAfterExport,
      config.exportAudio,
      './src/assets/cover.png',
    );
  }

  console.log(color('Finished.', `${c.bold}${palette.primary}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
