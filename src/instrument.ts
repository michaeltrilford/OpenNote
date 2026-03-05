import type { GeneratedNote } from './types';

export type InstrumentName = 'lead' | 'bass' | 'pad' | 'keys' | 'drums';

export type InstrumentProfile = {
  name: InstrumentName;
  label: string;
  midiChannel: number; // 0-15
  program: number; // 0-127
};

const DRUM_NOTES = [36, 38, 42, 46, 41, 43, 49, 51];

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function getInstrumentProfile(name: InstrumentName): InstrumentProfile {
  if (name === 'bass') return { name, label: 'Bass', midiChannel: 0, program: 38 };
  if (name === 'pad') return { name, label: 'Pad', midiChannel: 0, program: 88 };
  if (name === 'keys') return { name, label: 'Keys', midiChannel: 0, program: 4 };
  if (name === 'drums') return { name, label: 'Drums', midiChannel: 9, program: 0 };
  return { name: 'lead', label: 'Lead', midiChannel: 0, program: 80 };
}

export function applyInstrumentProfile(
  sequence: GeneratedNote[],
  instrument: InstrumentName,
): GeneratedNote[] {
  if (instrument === 'drums') {
    return sequence.map((note) => {
      const idx = Math.abs(Math.round(note.pitch)) % DRUM_NOTES.length;
      return {
        pitch: DRUM_NOTES[idx],
        velocity: clamp(note.velocity, 1, 127),
        durationMs: clamp(note.durationMs, 40, 400),
      };
    });
  }

  const shift = instrument === 'bass' ? -24 : instrument === 'pad' ? -12 : instrument === 'keys' ? 0 : 12;
  const min = instrument === 'bass' ? 28 : instrument === 'pad' ? 36 : instrument === 'keys' ? 48 : 60;
  const max = instrument === 'bass' ? 60 : instrument === 'pad' ? 84 : instrument === 'keys' ? 92 : 108;

  return sequence.map((note) => ({
    pitch: clamp(note.pitch + shift, min, max),
    velocity: clamp(note.velocity, 1, 127),
    durationMs: clamp(note.durationMs, 40, 4000),
  }));
}

