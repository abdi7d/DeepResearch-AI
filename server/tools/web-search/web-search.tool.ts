import { Tool, ToolExecutionResult } from '../types/tool.types.js';
import { defaultSearchProvider } from '../../search/providers/composite.provider.js';
import { SearchProvider } from '../../search/search.provider.js';

export class WebSearchTool implements Tool {
  public name = 'web_search';
  public description =
    'Search the web for up-to-date information, news, research papers, technical documentation, or facts.';

  public definition = {
    name: 'web_search',
    description:
      'Search the web for up-to-date information, news, research papers, technical documentation, or facts. Provide a precise, keyword-rich search query.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query string, optimized for web search engines.',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to retrieve (default: 5, max: 8).',
        },
      },
      required: ['query'],
    },
  };

  private provider: SearchProvider;

  constructor(provider?: SearchProvider) {
    this.provider = provider || defaultSearchProvider;
  }

  async execute(input: any): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    try {
      const query = typeof input?.query === 'string' ? input.query.trim() : '';
      if (!query || query.length < 2) {
        return {
          success: false,
          error: 'Search query must be at least 2 characters long.',
          executionTimeMs: Date.now() - startTime,
        };
      }

      const maxResults = Math.min(Math.max(Number(input?.maxResults) || 5, 1), 8);
      const results = await this.provider.search(query, { maxResults });

      return {
        success: true,
        data: {
          query,
          count: results.length,
          results,
        },
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message || 'Web search failed',
        executionTimeMs: Date.now() - startTime,
      };
    }
  }
}
