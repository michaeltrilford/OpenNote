import type { GeneratedNote, LLMProvider, NextNoteRequest } from '../types';
import { systemPrompt, userPrompt } from '../prompt';
import { computeRetryDelayMs, shouldRetryStatus, waitForRetry } from './retry';

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
};

function extractContent(content: ChatCompletionResponse['choices'][number]['message']['content']): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((c) => (typeof c?.text === 'string' ? c.text : ''))
      .join('')
      .trim();
  }
  return '';
}

export class GroqProvider implements LLMProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model = 'llama-3.3-70b-versatile',
  ) {}

  async nextNote(input: NextNoteRequest): Promise<GeneratedNote> {
    const maxRetries = 4;
    for (let attempt = 0; ; attempt++) {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.7,
          messages: [
            { role: 'system', content: systemPrompt() },
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
        throw new Error(`Groq request failed: ${res.status} ${text}`);
      }

      const json = (await res.json()) as ChatCompletionResponse;
      const text = extractContent(json.choices?.[0]?.message?.content);
      if (!text) throw new Error('Groq response missing content');
      return JSON.parse(text) as GeneratedNote;
    }
  }
}
