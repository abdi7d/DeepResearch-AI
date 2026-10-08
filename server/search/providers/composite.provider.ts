import { SearchProvider, SearchResult, SearchOptions } from '../search.provider.js';
import { DuckDuckGoSearchProvider } from './duckduckgo.provider.js';
import { GeminiSearchGroundingProvider } from './gemini-search.provider.js';

export class CompositeSearchProvider implements SearchProvider {
  public name = 'Autonomous Composite Web Search';
  private ddg: DuckDuckGoSearchProvider;
  private geminiGrounding: GeminiSearchGroundingProvider;

  constructor() {
    this.ddg = new DuckDuckGoSearchProvider();
    this.geminiGrounding = new GeminiSearchGroundingProvider();
  }

  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const maxResults = options?.maxResults || 6;
    let results: SearchResult[] = [];

    // Try DuckDuckGo first for fast, unencumbered live results
    try {
      results = await this.ddg.search(query, { maxResults });
    } catch (e) {
      console.warn('[CompositeSearchProvider] DDG failed, falling back to Gemini Grounding:', e);
    }

    // If DuckDuckGo returned few or 0 results, query Gemini Search Grounding
    if (results.length < 2) {
      try {
        const geminiResults = await this.geminiGrounding.search(query, { maxResults });
        // Merge without duplicates
        for (const gr of geminiResults) {
          if (!results.some((r) => r.url === gr.url)) {
            results.push(gr);
          }
        }
      } catch (e) {
        console.warn('[CompositeSearchProvider] Gemini Grounding also failed:', e);
      }
    }

    // Deduplicate by URL and Domain
    const seenUrls = new Set<string>();
    const deduplicated: SearchResult[] = [];

    for (const item of results) {
      try {
        const urlObj = new URL(item.url);
        // Normalize URL: remove trailing slash and tracking params
        urlObj.searchParams.delete('utm_source');
        urlObj.searchParams.delete('utm_medium');
        urlObj.searchParams.delete('utm_campaign');
        const normalized = urlObj.origin + urlObj.pathname;

        if (!seenUrls.has(normalized)) {
          seenUrls.add(normalized);
          deduplicated.push(item);
        }
      } catch {
        if (!seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          deduplicated.push(item);
        }
      }
    }

    return deduplicated.slice(0, maxResults);
  }
}

export const defaultSearchProvider = new CompositeSearchProvider();
