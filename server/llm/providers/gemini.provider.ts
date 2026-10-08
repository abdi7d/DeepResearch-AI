import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import type {
  LLMProvider,
  LLMGenerateOptions,
  LLMResponse,
  LLMToolResponse,
  ToolDefinition,
  ChatMessage,
  LLMToolCall,
} from '../llm.provider.js';

export class GeminiProvider implements LLMProvider {
  public name = 'Google Gemini';
  private ai: GoogleGenAI;
  private candidateModels = ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY || '';
    this.ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  async generate(prompt: string, options?: LLMGenerateOptions): Promise<LLMResponse> {
    const config: any = {};
    if (options?.systemInstruction) {
      config.systemInstruction = options.systemInstruction;
    }
    if (options?.temperature !== undefined) {
      config.temperature = options.temperature;
    }
    if (options?.jsonMode) {
      config.responseMimeType = 'application/json';
    }

    let lastError: any;
    for (const model of this.candidateModels) {
      try {
        const response = await this.ai.models.generateContent({
          model,
          contents: prompt,
          config,
        });

        return {
          text: response.text || '',
          finishReason: response.candidates?.[0]?.finishReason,
        };
      } catch (error: any) {
        lastError = error;
        console.warn(`[GeminiProvider] Model ${model} failed (${error.status || error.message}), trying next candidate...`);
      }
    }
    throw lastError;
  }

  async generateWithTools(
    prompt: string,
    tools: ToolDefinition[],
    history?: ChatMessage[],
    options?: LLMGenerateOptions
  ): Promise<LLMToolResponse> {
    try {
      // Convert tools to Gemini FunctionDeclarations
      const functionDeclarations: FunctionDeclaration[] = tools.map((tool) => {
        const properties: Record<string, any> = {};
        if (tool.parameters.properties) {
          for (const [key, prop] of Object.entries(tool.parameters.properties)) {
            let type = Type.STRING;
            if (prop.type === 'number' || prop.type === 'integer') type = Type.NUMBER;
            if (prop.type === 'boolean') type = Type.BOOLEAN;
            if (prop.type === 'array') type = Type.ARRAY;
            if (prop.type === 'object') type = Type.OBJECT;

            properties[key] = {
              type,
              description: prop.description || '',
            };
          }
        }

        return {
          name: tool.name,
          description: tool.description,
          parameters: {
            type: Type.OBJECT,
            properties,
            required: tool.parameters.required || [],
          },
        };
      });

      // Assemble contents including history if present
      const contents: any[] = [];
      if (history && history.length > 0) {
        for (const msg of history) {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
          });
        }
      }
      contents.push({
        role: 'user',
        parts: [{ text: prompt }],
      });

      const config: any = {
        tools: [{ functionDeclarations }],
      };

      if (options?.systemInstruction) {
        config.systemInstruction = options.systemInstruction;
      }
      if (options?.temperature !== undefined) {
        config.temperature = options.temperature;
      }

      let lastError: any;
      for (const model of this.candidateModels) {
        try {
          const response = await this.ai.models.generateContent({
            model,
            contents,
            config,
          });

          const toolCalls: LLMToolCall[] = [];
          if (response.functionCalls && response.functionCalls.length > 0) {
            for (const call of response.functionCalls) {
              toolCalls.push({
                id: (call as any).id,
                name: call.name || '',
                args: (call.args as Record<string, any>) || {},
              });
            }
          }

          return {
            text: response.text || '',
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
            finishReason: response.candidates?.[0]?.finishReason,
          };
        } catch (error: any) {
          lastError = error;
          console.warn(`[GeminiProvider] generateWithTools on ${model} failed: ${error.status || error.message}`);
        }
      }
      throw lastError;
    } catch (error) {
      console.error('[GeminiProvider] generateWithTools error:', error);
      throw error;
    }
  }

  async *stream(
    prompt: string,
    history?: ChatMessage[],
    options?: LLMGenerateOptions
  ): AsyncIterable<string> {
    const contents: any[] = [];
    if (history && history.length > 0) {
      for (const msg of history) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    const config: any = {};
    if (options?.systemInstruction) {
      config.systemInstruction = options.systemInstruction;
    }
    if (options?.temperature !== undefined) {
      config.temperature = options.temperature;
    }

    let responseStream: any = null;
    for (const model of this.candidateModels) {
      try {
        responseStream = await this.ai.models.generateContentStream({
          model,
          contents,
          config,
        });
        break;
      } catch (err: any) {
        console.warn(`[GeminiProvider] stream on ${model} failed: ${err.message}`);
      }
    }

    if (!responseStream) {
      throw new Error('All model stream candidates failed');
    }

    for await (const chunk of responseStream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  }
}
