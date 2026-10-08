import { GeminiProvider } from './providers/gemini.provider.js';
import type {
  LLMProvider,
  LLMGenerateOptions,
  LLMResponse,
  LLMToolResponse,
  ToolDefinition,
  ChatMessage,
} from './llm.provider.js';

export class LLMService {
  private provider: LLMProvider;

  constructor(provider?: LLMProvider) {
    this.provider = provider || new GeminiProvider();
  }

  setProvider(provider: LLMProvider) {
    this.provider = provider;
  }

  getProviderName(): string {
    return this.provider.name;
  }

  async generate(prompt: string, options?: LLMGenerateOptions): Promise<LLMResponse> {
    return this.retry(() => this.provider.generate(prompt, options));
  }

  async generateWithTools(
    prompt: string,
    tools: ToolDefinition[],
    history?: ChatMessage[],
    options?: LLMGenerateOptions
  ): Promise<LLMToolResponse> {
    return this.retry(() => this.provider.generateWithTools(prompt, tools, history, options));
  }

  async *stream(
    prompt: string,
    history?: ChatMessage[],
    options?: LLMGenerateOptions
  ): AsyncIterable<string> {
    for await (const chunk of this.provider.stream(prompt, history, options)) {
      yield chunk;
    }
  }

  private async retry<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
    let lastError: any;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        console.warn(`[LLMService] Attempt ${i + 1} failed: ${err.message || err}. Retrying...`);
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
      }
    }
    throw lastError;
  }
}

export const defaultLLMService = new LLMService();
