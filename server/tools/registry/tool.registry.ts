import { Tool, ToolExecutionResult } from '../types/tool.types.js';
import { ToolDefinition } from '../../llm/llm.provider.js';
import { WebSearchTool } from '../web-search/web-search.tool.js';
import { OpenPageTool } from '../open-page/open-page.tool.js';

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  constructor() {
    this.register(new WebSearchTool());
    this.register(new OpenPageTool());
  }

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  getDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map((t) => t.definition);
  }

  async execute(name: string, input: any): Promise<ToolExecutionResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        error: `Tool '${name}' is not registered.`,
        executionTimeMs: 0,
      };
    }
    return tool.execute(input);
  }
}

export const defaultToolRegistry = new ToolRegistry();
