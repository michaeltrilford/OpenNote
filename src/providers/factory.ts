import type { LLMProvider } from '../types';
import { ClaudeProvider } from './claudeProvider';
import { MockProvider } from './mockProvider';
import { OpenAIProvider } from './openaiProvider';

export type ProviderName = 'mock' | 'openai' | 'claude';

export function buildProvider(name: ProviderName): LLMProvider {
  if (name === 'mock') {
    return new MockProvider();
  }

  if (name === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('Missing OPENAI_API_KEY');
    return new OpenAIProvider(apiKey, process.env.OPENAI_MODEL || 'gpt-4.1-mini');
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY');
  return new ClaudeProvider(apiKey, process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-latest');
}
