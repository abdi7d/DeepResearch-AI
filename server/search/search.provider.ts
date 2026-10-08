export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  publishedAt?: string;
  score?: number;
}

export interface SearchOptions {
  maxResults?: number;
  timeFilter?: 'day' | 'week' | 'month' | 'year';
}

export interface SearchProvider {
  name: string;
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
}

export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'web';
  }
}
