import { access, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import type { GeneratedNote } from './types';

const SAMPLE_RATE = 44100;

function pitchToFrequency(pitch: number): number {
  return 440 * Math.pow(2, (pitch - 69) / 12);
}

function ensureParent(path: string): Promise<void> {
  return mkdir(dirname(path), { recursive: true });
}

function i16(n: number): number {
  return Math.max(-32768, Math.min(32767, Math.round(n)));
}

function buildWavPcm(sequence: GeneratedNote[]): Buffer {
  const samples: number[] = [];
  for (const note of sequence) {
    const freq = pitchToFrequency(note.pitch);
    const durationS = Math.max(0.02, note.durationMs / 1000);
    const count = Math.max(1, Math.floor(SAMPLE_RATE * durationS));
    const amp = (Math.max(1, Math.min(127, note.velocity)) / 127) * 0.35;

    for (let i = 0; i < count; i++) {
      const t = i / SAMPLE_RATE;
      const env = Math.exp((-4 * i) / count);
      const value = Math.sin(2 * Math.PI * freq * t) * amp * env;
      samples.push(i16(value * 32767));
    }
  }

  const dataSize = samples.length * 2;
  const b = Buffer.alloc(44 + dataSize);
  b.write('RIFF', 0);
  b.writeUInt32LE(36 + dataSize, 4);
  b.write('WAVE', 8);
  b.write('fmt ', 12);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(SAMPLE_RATE, 24);
  b.writeUInt32LE(SAMPLE_RATE * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write('data', 36);
  b.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    b.writeInt16LE(samples[i], 44 + i * 2);
  }
  return b;
}

async function getFfmpegBinary(): Promise<string> {
  try {
    const mod = await import('ffmpeg-static');
    const path = mod.default;
    if (path && typeof path === 'string') return path;
  } catch {
    // Fall back to system ffmpeg.
  }
  return 'ffmpeg';
}

async function runFfmpeg(args: string[]): Promise<void> {
  const bin = await getFfmpegBinary();
  return new Promise((resolvePromise, reject) => {
    const p = spawn(bin, args, { stdio: 'ignore' });
    p.on('error', reject);
    p.on('close', (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`ffmpeg exited with code ${code ?? -1}`));
    });
  });
}

export function isFfmpegMissing(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const maybe = err as { code?: string };
  return maybe.code === 'ENOENT';
}

export async function exportSequenceToWav(sequence: GeneratedNote[], outPath: string): Promise<string> {
  const fullPath = resolve(outPath);
  await ensureParent(fullPath);
  await writeFile(fullPath, buildWavPcm(sequence));
  return fullPath;
}

export async function exportWavToMp3(wavPath: string, outPath: string): Promise<string> {
  const fullPath = resolve(outPath);
  await ensureParent(fullPath);
  await runFfmpeg(['-y', '-i', resolve(wavPath), '-codec:a', 'libmp3lame', '-q:a', '2', fullPath]);
  return fullPath;
}

export async function exportWavToMp4(wavPath: string, outPath: string, coverImagePath?: string): Promise<string> {
  const fullPath = resolve(outPath);
  await ensureParent(fullPath);

  const audio = resolve(wavPath);
  const image = coverImagePath?.trim();
  let hasImage = false;
  if (image) {
    try {
      await access(resolve(image));
      hasImage = true;
    } catch {
      hasImage = false;
    }
  }
  const args = image
    ? [
        '-y',
        '-loop',
        '1',
        '-i',
        resolve(image),
        '-i',
        audio,
        '-c:v',
        'libx264',
        '-tune',
        'stillimage',
        '-c:a',
        'aac',
        '-b:a',
        '192k',
        '-pix_fmt',
        'yuv420p',
        '-shortest',
        fullPath,
      ]
    : [
        '-y',
        '-f',
        'lavfi',
        '-i',
        'color=c=#120a1a:s=1280x720:r=30',
        '-i',
        audio,
        '-c:v',
        'libx264',
        '-tune',
        'stillimage',
        '-c:a',
        'aac',
        '-b:a',
        '192k',
        '-pix_fmt',
        'yuv420p',
        '-shortest',
        fullPath,
      ];

  if (!hasImage) {
    await runFfmpeg([
      '-y',
      '-f',
      'lavfi',
      '-i',
      'color=c=#120a1a:s=1280x720:r=30',
      '-i',
      audio,
      '-c:v',
      'libx264',
      '-tune',
      'stillimage',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-pix_fmt',
      'yuv420p',
      '-shortest',
      fullPath,
    ]);
    return fullPath;
  }

  await runFfmpeg(args);
  return fullPath;
}
