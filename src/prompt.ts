import type { NextNoteRequest } from './types.js';

export function systemPrompt(): string {
  return [
    'You are a melody continuation engine for MIDI.',
    'Return JSON only, no markdown, no prose.',
    'JSON shape: {"pitch":number,"velocity":number,"durationMs":number}.',
    'pitch must be integer 0..127, velocity integer 1..127, durationMs integer >= 1.',
  ].join(' ');
}

export function userPrompt(input: NextNoteRequest): string {
  return JSON.stringify({
    instruction: 'Generate exactly one next MIDI note that musically continues the melody.',
    theme: input.theme,
    targetLength: input.targetLength,
    bpm: input.bpm,
    seedPitch: input.seedPitch,
    history: input.history,
    constraints: {
      maxJumpSemitones: 7,
      preferredPitchRange: [48, 84],
    },
  });
}
