export function normalizeApiKey(raw: string): string {
  let key = raw.trim();
  if (key.toLowerCase().startsWith('bearer ')) {
    key = key.slice(7).trim();
  }
  return key;
}

export function assertHeaderSafeApiKey(provider: string, raw: string): string {
  const key = normalizeApiKey(raw);
  if (!key) {
    throw new Error(`${provider} API key is empty.`);
  }

  // HTTP header values must be ByteString-safe; reject non-Latin-1 characters.
  const badIndex = [...key].findIndex((ch) => ch.codePointAt(0)! > 255);
  if (badIndex >= 0) {
    const bad = [...key][badIndex];
    throw new Error(
      `${provider} API key contains invalid character "${bad}". Re-enter key without extra symbols.`,
    );
  }

  if (/\s/.test(key)) {
    throw new Error(`${provider} API key contains whitespace. Re-enter key.`);
  }

  return key;
}

