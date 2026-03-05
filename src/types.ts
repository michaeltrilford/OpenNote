export type GeneratedNote = {
  pitch: number;      // 0..127
  velocity: number;   // 1..127
  durationMs: number; // >= 1
};

export type NextNoteRequest = {
  theme: string;
  targetLength: number;
  seedPitch: number;
  history: GeneratedNote[];
  bpm: number;
};

export interface LLMProvider {
  nextNote(input: NextNoteRequest): Promise<GeneratedNote>;
}
