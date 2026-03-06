import type { LLMProvider } from '../types';
import { ClaudeProvider } from './claudeProvider';
import { GeminiProvider } from './geminiProvider';
import { GrokProvider } from './grokProvider';
import { GroqProvider } from './groqProvider';
import { MockProvider } from './mockProvider';
import { OpenAIProvider } from './openaiProvider';

export type ProviderName = 'mock' | 'openai' | 'gemini' | 'claude' | 'groq' | 'grok';

export function buildProvider(name: ProviderName): LLMProvider {
  if (name === 'mock') {
    return new MockProvider();
  }

  if (name === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('Missing OPENAI_API_KEY');
    return new OpenAIProvider(apiKey, process.env.OPENAI_MODEL || 'gpt-4.1-mini');
  }

  if (name === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
    return new GeminiProvider(apiKey, process.env.GEMINI_MODEL || 'gemini-2.0-flash');
  }

  if (name === 'groq') {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('Missing GROQ_API_KEY');
    return new GroqProvider(apiKey, process.env.GROQ_MODEL || 'llama-3.3-70b-versatile');
  }

  if (name === 'grok') {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) throw new Error('Missing XAI_API_KEY');
    return new GrokProvider(apiKey, process.env.GROK_MODEL || 'grok-2-latest');
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY');
  return new ClaudeProvider(apiKey, process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-latest');
}
