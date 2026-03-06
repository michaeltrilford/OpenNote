import type { GeneratedNote, LLMProvider, NextNoteRequest } from '../types';
import { assertHeaderSafeApiKey } from './auth';
import { systemPrompt, userPrompt } from '../prompt';
import { computeRetryDelayMs, shouldRetryStatus, waitForRetry } from './retry';

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

function extractText(json: GeminiResponse): string {
  const parts = json.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((p) => (typeof p.text === 'string' ? p.text : ''))
    .join('')
    .trim();
}

export class GeminiProvider implements LLMProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model = 'gemini-2.0-flash',
  ) {}

  async nextNote(input: NextNoteRequest): Promise<GeneratedNote> {
    const apiKey = assertHeaderSafeApiKey('Gemini', this.apiKey);
    const maxRetries = 4;

    for (let attempt = 0; ; attempt++) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt() }],
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: userPrompt(input) }],
              },
            ],
          }),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        if (attempt < maxRetries && shouldRetryStatus(res.status)) {
          const delayMs = computeRetryDelayMs(res.headers.get('retry-after'), text, attempt);
          await waitForRetry(delayMs);
          continue;
        }
        throw new Error(`Gemini request failed: ${res.status} ${text}`);
      }

      const json = (await res.json()) as GeminiResponse;
      const text = extractText(json);
      if (!text) throw new Error('Gemini response missing text content');
      return JSON.parse(text) as GeneratedNote;
    }
  }
}

