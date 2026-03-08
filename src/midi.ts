import readline from 'node:readline';
import { createInterface } from 'node:readline/promises';
import type { MetronomeMode, NoteEvent } from './arrangement.js';
import type { InstrumentProfile } from './instrument.js';
import type { GeneratedNote } from './types.js';

export type MidiNoteOn = {
  pitch: number;
  velocity: number;
};

type SeedOptions = {
  baseOctave?: number;
};

type PlaybackOptions = {
  beep?: boolean;
  instrument?: InstrumentProfile;
  metronome?: MetronomeMode;
  bpm?: number;
};

const SCALE_OFFSETS = [0, 2, 4, 5, 7, 9, 11, 12];
const SHIFT_MAP: Record<string, number> = {
  '!': 1,
  '@': 2,
  '#': 3,
  '$': 4,
  '%': 5,
  '^': 6,
  '&': 7,
  '*': 8,
};
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

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

function pitchToName(pitch: number): string {
  const octave = Math.floor(pitch / 12) - 1;
  return `${NOTE_NAMES[pitch % 12]}${octave}`;
}

function numberToPitch(numberKey: number, octave: number, sharp: boolean): number {
  const base = 12 * (octave + 1) + SCALE_OFFSETS[numberKey - 1];
  return Math.max(0, Math.min(127, base + (sharp ? 1 : 0)));
}

async function lineFallbackSeed(baseOctave: number): Promise<MidiNoteOn> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const raw = await rl.question(
      'Seed key fallback (1-8, or !@#$%^&* for sharps, +/- octave not supported here): ',
    );
    const str = raw.trim();
    const fromShiftSymbol = SHIFT_MAP[str];
    const fromDigit = /^[1-8]$/.test(str) ? Number.parseInt(str, 10) : NaN;
    const degree = Number.isFinite(fromShiftSymbol)
      ? fromShiftSymbol
      : Number.isFinite(fromDigit)
        ? fromDigit
        : 1;
    const sharp = Boolean(fromShiftSymbol);
    const pitch = numberToPitch(degree, baseOctave, sharp);
    console.log(`Selected seed: ${pitchToName(pitch)} (${pitch})`);
    return { pitch, velocity: 100 };
  } finally {
    rl.close();
  }
}

// Test-mode keyboard input:
// 1-8 = scale degrees, Shift+1-8 = sharps, +/- changes octave.
export async function waitForSeedNote(options: SeedOptions = {}): Promise<MidiNoteOn> {
  let octave = options.baseOctave ?? 4;

  console.log(`\n${color('Keyboard seed mode', `${c.bold}${palette.primary}`)}`);
  console.log(color('Press 1-8 to choose note, Shift+1-8 for sharp, +/- for octave, q to cancel.', palette.soft));
  console.log(color('Click this terminal window first if key presses are not detected.', `${c.bold}${palette.primary}`));
  console.log(color(`Current octave: ${octave}`, palette.soft));

  readline.emitKeypressEvents(process.stdin);
  if (!process.stdin.isTTY) {
    return lineFallbackSeed(octave);
  }

  process.stdin.setRawMode(true);
  process.stdin.resume();

  return new Promise<MidiNoteOn>((resolve, reject) => {
    const cleanup = () => {
      process.stdin.off('keypress', onKeypress);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    };

    const onKeypress = (str: string, key: { name?: string; shift?: boolean; ctrl?: boolean }) => {
      if (key.ctrl && key.name === 'c') {
        cleanup();
        reject(new Error('Seed note selection cancelled.'));
        return;
      }

      if (str === '+' || str === '=') {
        octave = Math.min(8, octave + 1);
        console.log(color(`Octave: ${octave}`, palette.soft));
        return;
      }

      if (str === '-') {
        octave = Math.max(0, octave - 1);
        console.log(color(`Octave: ${octave}`, palette.soft));
        return;
      }

      if (key.name === 'q' || key.name === 'escape') {
        cleanup();
        reject(new Error('Seed note selection cancelled.'));
        return;
      }

      const fromShiftSymbol = SHIFT_MAP[str];
      const fromKeyName = key.name && /^[1-8]$/.test(key.name) ? Number.parseInt(key.name, 10) : NaN;
      const degree = Number.isFinite(fromShiftSymbol)
        ? fromShiftSymbol
        : Number.isFinite(fromKeyName)
          ? fromKeyName
          : NaN;

      if (!Number.isFinite(degree)) return;

      const sharp = Boolean(fromShiftSymbol) || Boolean(key.shift);
      const pitch = numberToPitch(degree, octave, sharp);
      const noteName = pitchToName(pitch);
      console.log(color(`Selected seed: ${noteName} (${pitch})`, palette.primary));
      cleanup();
      resolve({ pitch, velocity: 100 });
    };

    process.stdin.on('keypress', onKeypress);
  });
}

// Replace with real MIDI output to your selected synth/device.
export async function playSequenceToOutput(
  sequence: GeneratedNote[] | NoteEvent[],
  options: PlaybackOptions = {},
): Promise<void> {
  const events: NoteEvent[] = (sequence as NoteEvent[])[0]?.startMs != null
    ? (sequence as NoteEvent[])
    : (() => {
        const out: NoteEvent[] = [];
        let t = 0;
        for (const n of sequence as GeneratedNote[]) {
          out.push({ pitch: n.pitch, velocity: n.velocity, durationMs: n.durationMs, startMs: t, channel: 0 });
          t += n.durationMs;
        }
        return out;
      })();

  events.sort((a, b) => a.startMs - b.startMs);

  if (options.instrument) {
    console.log(
      color(
        `MIDI PROGRAM_CHANGE ch=${options.instrument.midiChannel + 1} program=${options.instrument.program} (${options.instrument.label})`,
        `${c.bold}${palette.primary}`,
      ),
    );
  }

  const beatMs = 60000 / Math.max(1, options.bpm ?? 120);
  if (options.metronome === 'count-in' || options.metronome === 'always') {
    for (let i = 0; i < 4; i++) {
      console.log(color(`METRONOME ${i + 1}`, palette.soft));
      if (options.beep) process.stdout.write('\x07');
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, beatMs));
    }
  }

  let prevStart = 0;
  for (const note of events) {
    const wait = Math.max(0, note.startMs - prevStart);
    if (wait > 0) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, wait));
    }
    console.log(color(`MIDI OUT NOTE_ON ${note.pitch} ${note.velocity}`, palette.primary));
    if (options.beep) process.stdout.write('\x07');
    if (options.metronome === 'always' && note.startMs % Math.max(1, Math.round(beatMs)) < 24) {
      console.log(color('METRONOME', palette.soft));
    }
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, note.durationMs));
    console.log(color(`MIDI OUT NOTE_OFF ${note.pitch}`, palette.primary));
    prevStart = note.startMs;
  }
}
