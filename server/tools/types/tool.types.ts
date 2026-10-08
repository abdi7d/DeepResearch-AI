import { ToolDefinition } from '../../llm/llm.provider.js';

export interface Tool {
  name: string;
  description: string;
  definition: ToolDefinition;
  execute(input: any): Promise<ToolExecutionResult>;
}

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTimeMs: number;
}
