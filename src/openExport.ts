import { spawn } from 'node:child_process';

export type OpenAfterExport = 'none' | 'finder' | 'garageband';

function runOpen(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('open', args, { stdio: 'ignore' });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`open exited with code ${code ?? -1}`));
    });
  });
}

export async function openExportTarget(path: string, target: OpenAfterExport): Promise<void> {
  if (target === 'none') return;
  if (target === 'finder') {
    await runOpen(['-R', path]);
    return;
  }
  await runOpen(['-a', 'GarageBand', path]);
}

