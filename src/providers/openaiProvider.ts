import type { GeneratedNote, LLMProvider, NextNoteRequest } from '../types';
import { systemPrompt, userPrompt } from '../prompt';

export class OpenAIProvider implements LLMProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model = 'gpt-4.1-mini',
  ) {}

  async nextNote(input: NextNoteRequest): Promise<GeneratedNote> {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        input: [
          { role: 'system', content: [{ type: 'input_text', text: systemPrompt() }] },
          { role: 'user', content: [{ type: 'input_text', text: userPrompt(input) }] },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI request failed: ${res.status} ${text}`);
    }

    const json = await res.json() as { output_text?: string };
    if (!json.output_text) {
      throw new Error('OpenAI response missing output_text');
    }

    return JSON.parse(json.output_text) as GeneratedNote;
  }
}
