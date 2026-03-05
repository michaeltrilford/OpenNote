import type { GeneratedNote, LLMProvider, NextNoteRequest } from '../types';

// Simple fallback provider for local testing without API keys.
export class MockProvider implements LLMProvider {
  async nextNote(input: NextNoteRequest): Promise<GeneratedNote> {
    const last = input.history.at(-1)?.pitch ?? input.seedPitch;
    const stepChoices = [-2, -1, 1, 2, 3];
    const step = stepChoices[Math.floor(Math.random() * stepChoices.length)];
    return {
      pitch: Math.max(48, Math.min(84, last + step)),
      velocity: 90,
      durationMs: 300,
    };
  }
}
