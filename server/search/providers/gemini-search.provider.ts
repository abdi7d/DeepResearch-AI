import { GoogleGenAI } from '@google/genai';
import { SearchProvider, SearchResult, SearchOptions, extractDomain } from '../search.provider.js';

export class GeminiSearchGroundingProvider implements SearchProvider {
  public name = 'Google Search Grounding';
  private ai: GoogleGenAI;

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

  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const maxResults = options?.maxResults || 6;
    const candidateModels = ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    for (const model of candidateModels) {
      try {
        const response = await this.ai.models.generateContent({
          model,
          contents: `Perform a search for the following topic and list recent, authoritative findings and sources: "${query}"`,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });

        const results: SearchResult[] = [];
        const metadata = response.candidates?.[0]?.groundingMetadata;

        if (metadata && (metadata as any).groundingChunks) {
          for (const chunk of (metadata as any).groundingChunks) {
            if (chunk.web?.uri && chunk.web?.title) {
              const uri = chunk.web.uri;
              if (!results.some((r) => r.url === uri)) {
                results.push({
                  title: chunk.web.title,
                  url: uri,
                  snippet: chunk.web.title,
                  domain: extractDomain(uri),
                });
              }
            }
          }
        }

        if (results.length > 0) {
          return results.slice(0, maxResults);
        }
      } catch (error) {
        console.warn(`[GeminiSearchGroundingProvider] Model ${model} grounding failed:`, (error as Error).message);
      }
    }
    return [];
  }
}
