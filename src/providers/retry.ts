const RETRYABLE_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(value: string | null): number | null {
  if (!value) return null;
  const sec = Number.parseFloat(value);
  if (Number.isFinite(sec) && sec >= 0) return Math.round(sec * 1000);
  const date = Date.parse(value);
  if (!Number.isNaN(date)) {
    const diff = date - Date.now();
    return diff > 0 ? diff : 0;
  }
  return null;
}

function parseTryAgainMs(text: string): number | null {
  const match = text.match(/try again in\s+(\d+(?:\.\d+)?)s/i);
  if (!match) return null;
  const sec = Number.parseFloat(match[1]);
  if (!Number.isFinite(sec) || sec < 0) return null;
  return Math.round(sec * 1000);
}

function backoffMs(attempt: number): number {
  const base = 500 * Math.pow(2, attempt);
  const jitter = Math.floor(Math.random() * 250);
  return base + jitter;
}

export function shouldRetryStatus(status: number): boolean {
  return RETRYABLE_STATUS.has(status);
}

export function computeRetryDelayMs(
  headersRetryAfter: string | null,
  responseText: string,
  attempt: number,
): number {
  const fromHeader = parseRetryAfterMs(headersRetryAfter);
  if (fromHeader != null) return Math.min(10_000, Math.max(250, fromHeader));

  const fromBody = parseTryAgainMs(responseText);
  if (fromBody != null) return Math.min(10_000, Math.max(250, fromBody));

  return Math.min(10_000, backoffMs(attempt));
}

export async function waitForRetry(ms: number): Promise<void> {
  await sleep(ms);
}

