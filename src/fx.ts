import type { GeneratedNote } from './types.js';

export type FxPresetName = 'clean' | 'dark' | 'grime' | 'lush' | 'punch';
export type DecayStyle = 'tight' | 'balanced' | 'long';
export type Waveform = 'sine' | 'saw' | 'square';

export type FxSettings = {
  preset: FxPresetName;
  decay: DecayStyle;
  waveform: Waveform;
  drive: number; // 0..1
  reverb: number; // 0..1
  bitcrush: number; // 0..1
  durationScale: number;
  velocityScale: number;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function buildFxSettings(preset: FxPresetName, decay: DecayStyle): FxSettings {
  const base: Record<FxPresetName, Omit<FxSettings, 'preset' | 'decay' | 'durationScale' | 'velocityScale'>> = {
    clean: { waveform: 'sine', drive: 0.02, reverb: 0.04, bitcrush: 0.0 },
    dark: { waveform: 'saw', drive: 0.16, reverb: 0.12, bitcrush: 0.05 },
    grime: { waveform: 'square', drive: 0.45, reverb: 0.08, bitcrush: 0.32 },
    lush: { waveform: 'saw', drive: 0.08, reverb: 0.38, bitcrush: 0.0 },
    punch: { waveform: 'square', drive: 0.28, reverb: 0.02, bitcrush: 0.1 },
  };

  const decayScale = decay === 'tight' ? 0.62 : decay === 'long' ? 1.5 : 1;
  const velocityScale = preset === 'punch' ? 1.12 : preset === 'dark' ? 1.06 : 1;
  return {
    preset,
    decay,
    ...base[preset],
    durationScale: decayScale,
    velocityScale,
  };
}

export function applyFxToSequence(sequence: GeneratedNote[], fx: FxSettings): GeneratedNote[] {
  return sequence.map((note) => ({
    pitch: clamp(Math.round(note.pitch), 0, 127),
    velocity: clamp(Math.round(note.velocity * fx.velocityScale), 1, 127),
    durationMs: clamp(Math.round(note.durationMs * fx.durationScale), 35, 6000),
  }));
}

