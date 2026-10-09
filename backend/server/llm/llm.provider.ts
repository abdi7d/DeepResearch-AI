export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ToolParameterSchema {
  type: string;
  description?: string;
  properties?: Record<string, {
    type: string;
    description?: string;
    enum?: string[];
  }>;
  required?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameterSchema;
}

export interface LLMGenerateOptions {
  temperature?: number;
  maxTokens?: number;
  systemInstruction?: string;
  jsonMode?: boolean;
}

export interface LLMResponse {
  text: string;
  finishReason?: string;
  tokensUsed?: number;
}

export interface LLMToolCall {
  id?: string;
  name: string;
  args: Record<string, any>;
}

export interface LLMToolResponse {
  text?: string;
  toolCalls?: LLMToolCall[];
  finishReason?: string;
}

export interface LLMProvider {
  name: string;
  generate(prompt: string, options?: LLMGenerateOptions): Promise<LLMResponse>;
  generateWithTools(
    prompt: string,
    tools: ToolDefinition[],
    history?: ChatMessage[],
    options?: LLMGenerateOptions
  ): Promise<LLMToolResponse>;
  stream(
    prompt: string,
    history?: ChatMessage[],
    options?: LLMGenerateOptions
  ): AsyncIterable<string>;
}
