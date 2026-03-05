import type { GeneratedNote } from './types';

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function sanitizeNote(note: GeneratedNote): GeneratedNote {
  return {
    pitch: clamp(Math.round(note.pitch), 0, 127),
    velocity: clamp(Math.round(note.velocity), 1, 127),
    durationMs: Math.max(1, Math.round(note.durationMs)),
  };
}
