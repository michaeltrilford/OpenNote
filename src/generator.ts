import type { GeneratedNote, LLMProvider } from './types.js';
import { sanitizeNote } from './validate.js';

export type GenerationConfig = {
  theme: string;
  targetLength: number;
  bpm: number;
};

export async function generateSequence(
  provider: LLMProvider,
  seedPitch: number,
  config: GenerationConfig,
): Promise<GeneratedNote[]> {
  const history: GeneratedNote[] = [];

  for (let i = 0; i < config.targetLength; i++) {
    const raw = await provider.nextNote({
      theme: config.theme,
      targetLength: config.targetLength,
      seedPitch,
      history,
      bpm: config.bpm,
    });
    history.push(sanitizeNote(raw));
  }

  return history;
}
