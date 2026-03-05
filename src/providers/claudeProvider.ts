import type { GeneratedNote, LLMProvider, NextNoteRequest } from '../types';
import { systemPrompt, userPrompt } from '../prompt';
import { computeRetryDelayMs, shouldRetryStatus, waitForRetry } from './retry';

export class ClaudeProvider implements LLMProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model = 'claude-3-5-sonnet-latest',
  ) {}

  async nextNote(input: NextNoteRequest): Promise<GeneratedNote> {
    const maxRetries = 4;
    for (let attempt = 0; ; attempt++) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 120,
          system: systemPrompt(),
          messages: [
            { role: 'user', content: userPrompt(input) },
          ],
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        if (attempt < maxRetries && shouldRetryStatus(res.status)) {
          const delayMs = computeRetryDelayMs(res.headers.get('retry-after'), text, attempt);
          await waitForRetry(delayMs);
          continue;
        }
        throw new Error(`Claude request failed: ${res.status} ${text}`);
      }

      const json = await res.json() as { content?: Array<{ type?: string; text?: string }> };
      const text = json.content?.find((item) => item.type === 'text')?.text;
      if (!text) {
        throw new Error('Claude response missing text content');
      }

      return JSON.parse(text) as GeneratedNote;
    }
  }
}
