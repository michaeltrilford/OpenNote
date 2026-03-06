import type { GeneratedNote } from './types';

export type GenerationMode = 'single' | 'backing';
export type PitchRange = 'low' | 'mid' | 'high';
export type GateStyle = 'tight' | 'balanced' | 'long';
export type ModRate = 'off' | 'slow' | 'med' | 'fast';
export type ModTarget = 'velocity' | 'duration' | 'pitch';
export type MetronomeMode = 'off' | 'count-in' | 'always';
export type GrowthStyle = 'flat' | 'build';

export type NoteEvent = {
  pitch: number;
  velocity: number;
  durationMs: number;
  startMs: number;
  channel: number;
};

export type BackingControls = {
  drums: boolean;
  bass: boolean;
  clap: boolean;
  openHat: boolean;
  perc: boolean;
  metronome: MetronomeMode;
  swing: number; // 0..100
  gate: GateStyle;
  mutate: number; // 0..100
  deviate: number; // 0..100
};

export type PitchControls = {
  transpose: number; // -12..12
  range: PitchRange;
  snapScale: boolean;
};

export type ModulateControls = {
  rate: ModRate;
  depth: number; // 0..100
  target: ModTarget;
};

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function rangeBounds(range: PitchRange): [number, number] {
  if (range === 'low') return [28, 60];
  if (range === 'high') return [67, 108];
  return [48, 84];
}

function closestScalePitch(p: number): number {
  let best = p;
  let bestDist = Infinity;
  for (let candidate = p - 6; candidate <= p + 6; candidate++) {
    const pc = ((candidate % 12) + 12) % 12;
    if (!MAJOR_SCALE.includes(pc)) continue;
    const d = Math.abs(candidate - p);
    if (d < bestDist) {
      best = candidate;
      bestDist = d;
    }
  }
  return best;
}

function gateMultiplier(gate: GateStyle): number {
  if (gate === 'tight') return 0.7;
  if (gate === 'long') return 1.25;
  return 1;
}

function modRateCycles(rate: ModRate, n: number): number {
  if (rate === 'off') return 0;
  if (rate === 'slow') return Math.max(1, n / 16);
  if (rate === 'fast') return Math.max(2, n / 4);
  return Math.max(1.5, n / 8);
}

function lfo(i: number, n: number, rate: ModRate): number {
  const cycles = modRateCycles(rate, n);
  if (cycles === 0) return 0;
  const phase = (i / Math.max(1, n - 1)) * Math.PI * 2 * cycles;
  return Math.sin(phase);
}

function swingify(sequence: GeneratedNote[], swing: number): GeneratedNote[] {
  if (swing <= 0) return sequence;
  const amt = clamp(swing / 100, 0, 1) * 0.22;
  return sequence.map((n, i) => ({
    ...n,
    durationMs: Math.max(30, Math.round(n.durationMs * (i % 2 === 0 ? 1 + amt : 1 - amt))),
  }));
}

function mutDeviate(sequence: GeneratedNote[], mutate: number, deviate: number): GeneratedNote[] {
  const mutateChance = clamp(mutate, 0, 100) / 100;
  const dev = clamp(deviate, 0, 100) / 100;
  return sequence.map((n) => {
    let pitch = n.pitch;
    let velocity = n.velocity;
    let durationMs = n.durationMs;
    if (Math.random() < mutateChance) {
      pitch += Math.round((Math.random() * 2 - 1) * (2 + dev * 8));
      velocity += Math.round((Math.random() * 2 - 1) * (6 + dev * 18));
      durationMs += Math.round((Math.random() * 2 - 1) * (25 + dev * 180));
    }
    return {
      pitch: clamp(pitch, 0, 127),
      velocity: clamp(velocity, 1, 127),
      durationMs: clamp(durationMs, 35, 5000),
    };
  });
}

export function transformMelody(
  sequence: GeneratedNote[],
  pitch: PitchControls,
  mod: ModulateControls,
  backing: BackingControls,
): GeneratedNote[] {
  const [minP, maxP] = rangeBounds(pitch.range);
  const gMul = gateMultiplier(backing.gate);
  const depth = clamp(mod.depth, 0, 100) / 100;
  const base = sequence.map((n, i, arr) => {
    let p = clamp(n.pitch + clamp(pitch.transpose, -12, 12), minP, maxP);
    if (pitch.snapScale) p = closestScalePitch(p);
    let v = n.velocity;
    let d = Math.max(35, Math.round(n.durationMs * gMul));
    const modv = lfo(i, arr.length, mod.rate) * depth;
    if (mod.target === 'pitch') p = clamp(Math.round(p + modv * 2.5), minP, maxP);
    if (mod.target === 'velocity') v = clamp(Math.round(v + modv * 22), 1, 127);
    if (mod.target === 'duration') d = clamp(Math.round(d * (1 + modv * 0.35)), 35, 6000);
    return { pitch: p, velocity: v, durationMs: d };
  });
  const swung = swingify(base, backing.swing);
  return mutDeviate(swung, backing.mutate, backing.deviate);
}

export function applyGrowthAndDuration(
  sequence: GeneratedNote[],
  growth: GrowthStyle,
  durationStretch: number,
): GeneratedNote[] {
  const stretch = clamp(durationStretch, 1, 4);
  if (growth === 'flat' && Math.abs(stretch - 1) < 0.001) return sequence;

  return sequence.map((n, i, arr) => {
    const progress = arr.length <= 1 ? 1 : i / (arr.length - 1);
    const complexity = Math.pow(progress, 1.35);
    let pitch = n.pitch;
    let velocity = n.velocity;
    let durationMs = Math.round(n.durationMs * stretch);

    if (growth === 'build') {
      velocity += Math.round(complexity * 20);
      durationMs = Math.round(durationMs * (0.95 + complexity * 0.35));
      if (complexity > 0.55 && i % 5 === 4) pitch += 1;
      if (complexity > 0.78 && i % 7 === 6) pitch += 1;
    }

    return {
      pitch: clamp(pitch, 0, 127),
      velocity: clamp(velocity, 1, 127),
      durationMs: clamp(durationMs, 35, 8000),
    };
  });
}

export function sequenceToEvents(sequence: GeneratedNote[], channel: number): NoteEvent[] {
  const out: NoteEvent[] = [];
  let t = 0;
  for (const n of sequence) {
    out.push({
      pitch: clamp(Math.round(n.pitch), 0, 127),
      velocity: clamp(Math.round(n.velocity), 1, 127),
      durationMs: Math.max(35, Math.round(n.durationMs)),
      startMs: t,
      channel: clamp(channel, 0, 15),
    });
    t += Math.max(35, Math.round(n.durationMs));
  }
  return out;
}

function pickStyle(theme: string): 'techno' | 'trap' | 'ambient' | 'other' {
  const t = theme.toLowerCase();
  if (t.includes('techno') || t.includes('house')) return 'techno';
  if (t.includes('trap') || t.includes('hip')) return 'trap';
  if (t.includes('ambient') || t.includes('cinematic')) return 'ambient';
  return 'other';
}

export function buildBackingEvents(
  melodyEvents: NoteEvent[],
  theme: string,
  bpm: number,
  controls: BackingControls,
  growth: GrowthStyle = 'flat',
): NoteEvent[] {
  if (!controls.drums && !controls.bass && !controls.clap && !controls.openHat && !controls.perc) return [];
  const out: NoteEvent[] = [];
  const style = pickStyle(theme);
  const beatMs = 60000 / Math.max(1, bpm);
  const endMs = melodyEvents.length
    ? Math.max(...melodyEvents.map((e) => e.startMs + e.durationMs))
    : beatMs * 8;
  const bars = Math.max(1, Math.ceil(endMs / (beatMs * 4)));

  if (controls.drums) {
    for (let bar = 0; bar < bars; bar++) {
      const buildProgress = bars <= 1 ? 1 : bar / (bars - 1);
      const allowSnare = growth === 'build' ? buildProgress > 0.28 : true;
      const allowHat = growth === 'build' ? buildProgress > 0.52 : true;
      const allowPerc = growth === 'build' ? buildProgress > 0.65 : true;
      const barStart = bar * beatMs * 4;
      for (let step = 0; step < 16; step++) {
        const stepMs = beatMs / 4;
        const t = barStart + step * stepMs;
        const beat = step % 4 === 0;
        const off = step % 2 === 0;
        if (style === 'techno') {
          if (beat) out.push({ pitch: 36, velocity: 104, durationMs: 90, startMs: t, channel: 9 }); // kick
          if (allowSnare && step % 4 === 2) out.push({ pitch: 38, velocity: 95, durationMs: 90, startMs: t, channel: 9 }); // snare
          if (allowHat && off) out.push({ pitch: 42, velocity: 92, durationMs: 45, startMs: t, channel: 9 }); // hihat
          if (controls.clap && allowSnare && step % 8 === 4) out.push({ pitch: 39, velocity: 84, durationMs: 80, startMs: t, channel: 9 }); // clap
          if (controls.openHat && allowHat && step % 8 === 6) out.push({ pitch: 46, velocity: 80, durationMs: 110, startMs: t, channel: 9 }); // open hat
          if (controls.perc && allowPerc && step % 16 === 11) out.push({ pitch: 45, velocity: 76, durationMs: 90, startMs: t, channel: 9 }); // perc tom
        } else if (style === 'trap') {
          if (step === 0 || step === 10) out.push({ pitch: 36, velocity: 105, durationMs: 90, startMs: t, channel: 9 });
          if (allowSnare && (step === 4 || step === 12)) out.push({ pitch: 38, velocity: 95, durationMs: 90, startMs: t, channel: 9 });
          if (allowHat && step % 2 === 0) out.push({ pitch: 42, velocity: 88, durationMs: 35, startMs: t, channel: 9 });
          if (controls.clap && allowSnare && (step === 4 || step === 12)) out.push({ pitch: 39, velocity: 80, durationMs: 70, startMs: t, channel: 9 });
          if (controls.openHat && allowHat && (step === 7 || step === 15)) out.push({ pitch: 46, velocity: 78, durationMs: 95, startMs: t, channel: 9 });
          if (controls.perc && allowPerc && step % 16 === 14) out.push({ pitch: 50, velocity: 72, durationMs: 90, startMs: t, channel: 9 });
        } else if (style === 'ambient') {
          if (step === 0) out.push({ pitch: 36, velocity: 70, durationMs: 120, startMs: t, channel: 9 });
          if (allowSnare && step === 8) out.push({ pitch: 38, velocity: 64, durationMs: 120, startMs: t, channel: 9 });
          if (allowHat && step % 4 === 0) out.push({ pitch: 42, velocity: 70, durationMs: 40, startMs: t, channel: 9 });
          if (controls.clap && allowSnare && step === 12) out.push({ pitch: 39, velocity: 56, durationMs: 90, startMs: t, channel: 9 });
          if (controls.openHat && allowHat && step === 10) out.push({ pitch: 46, velocity: 62, durationMs: 110, startMs: t, channel: 9 });
          if (controls.perc && allowPerc && step === 14) out.push({ pitch: 75, velocity: 52, durationMs: 80, startMs: t, channel: 9 });
        } else {
          if (beat) out.push({ pitch: 36, velocity: 98, durationMs: 90, startMs: t, channel: 9 });
          if (allowSnare && step % 8 === 4) out.push({ pitch: 38, velocity: 88, durationMs: 90, startMs: t, channel: 9 });
          if (allowHat && off) out.push({ pitch: 42, velocity: 84, durationMs: 45, startMs: t, channel: 9 });
          if (controls.clap && allowSnare && step % 8 === 4) out.push({ pitch: 39, velocity: 76, durationMs: 80, startMs: t, channel: 9 });
          if (controls.openHat && allowHat && step % 8 === 6) out.push({ pitch: 46, velocity: 74, durationMs: 100, startMs: t, channel: 9 });
          if (controls.perc && allowPerc && step % 16 === 13) out.push({ pitch: 50, velocity: 70, durationMs: 85, startMs: t, channel: 9 });
        }
      }
    }
  }

  if (controls.bass) {
    for (const e of melodyEvents) {
      if (e.startMs % Math.round(beatMs * 2) !== 0) continue;
      out.push({
        pitch: clamp(e.pitch - 24, 28, 60),
        velocity: clamp(e.velocity - 10, 45, 110),
        durationMs: clamp(Math.round(e.durationMs * 1.2), 80, 600),
        startMs: e.startMs,
        channel: 1,
      });
    }
  }

  return out.sort((a, b) => a.startMs - b.startMs);
}
