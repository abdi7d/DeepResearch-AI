import * as cheerio from 'cheerio';
import { SearchProvider, SearchResult, SearchOptions, extractDomain } from '../search.provider.js';

export class DuckDuckGoSearchProvider implements SearchProvider {
  public name = 'DuckDuckGo Web Search';

  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const maxResults = options?.maxResults || 6;
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        throw new Error(`DuckDuckGo returned HTTP ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const results: SearchResult[] = [];

      $('.result').each((_, element) => {
        if (results.length >= maxResults) return;

        const titleEl = $(element).find('.result__title a');
        const snippetEl = $(element).find('.result__snippet');
        const rawUrl = titleEl.attr('href') || '';

        // Extract actual URL if it's wrapped in duckduckgo redirect uddg=
        let finalUrl = rawUrl;
        if (rawUrl.includes('uddg=')) {
          const match = rawUrl.match(/uddg=([^&]+)/);
          if (match && match[1]) {
            try {
              finalUrl = decodeURIComponent(match[1]);
            } catch {
              finalUrl = rawUrl;
            }
          }
        }

        const title = titleEl.text().trim();
        const snippet = snippetEl.text().trim();

        if (title && finalUrl && finalUrl.startsWith('http')) {
          results.push({
            title,
            url: finalUrl,
            snippet: snippet || title,
            domain: extractDomain(finalUrl),
          });
        }
      });

      return results;
    } catch (error) {
      console.warn('[DuckDuckGoSearchProvider] Search error:', (error as Error).message);
      return [];
    }
  }
}
