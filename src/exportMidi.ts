import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { GeneratedNote } from './types';

function u32be(n: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0, 0);
  return b;
}

function u16be(n: number): Buffer {
  const b = Buffer.alloc(2);
  b.writeUInt16BE(n >>> 0, 0);
  return b;
}

function varLen(n: number): number[] {
  let value = n >>> 0;
  const out = [value & 0x7f];
  value >>= 7;
  while (value > 0) {
    out.unshift((value & 0x7f) | 0x80);
    value >>= 7;
  }
  return out;
}

function ticksFromMs(durationMs: number, bpm: number, tpqn: number): number {
  const msPerBeat = 60000 / bpm;
  return Math.max(1, Math.round((durationMs / msPerBeat) * tpqn));
}

export async function exportSequenceToMidi(
  sequence: GeneratedNote[],
  bpm: number,
  outPath: string,
): Promise<string> {
  const tpqn = 480;
  const events: number[] = [];

  const tempoUsPerBeat = Math.max(1, Math.round(60_000_000 / bpm));
  events.push(0x00, 0xff, 0x51, 0x03);
  events.push((tempoUsPerBeat >> 16) & 0xff, (tempoUsPerBeat >> 8) & 0xff, tempoUsPerBeat & 0xff);

  for (const note of sequence) {
    const pitch = Math.max(0, Math.min(127, Math.round(note.pitch)));
    const velocity = Math.max(1, Math.min(127, Math.round(note.velocity)));
    const ticks = ticksFromMs(note.durationMs, bpm, tpqn);

    events.push(...varLen(0), 0x90, pitch, velocity);
    events.push(...varLen(ticks), 0x80, pitch, 0x00);
  }

  events.push(0x00, 0xff, 0x2f, 0x00);
  const trackData = Buffer.from(events);

  const header = Buffer.concat([
    Buffer.from('MThd'),
    u32be(6),
    u16be(0),
    u16be(1),
    u16be(tpqn),
  ]);

  const track = Buffer.concat([
    Buffer.from('MTrk'),
    u32be(trackData.length),
    trackData,
  ]);

  const fullPath = resolve(outPath);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, Buffer.concat([header, track]));
  return fullPath;
}
