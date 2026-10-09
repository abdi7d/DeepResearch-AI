import {
  StructuredResearch,
  SourceReference,
  ResearchLogEntry,
  StreamEvent,
} from '../../types/index.js';

export interface ResearchAgentOptions {
  maxToolCalls?: number;
  maxSearchCalls?: number;
  maxPageCalls?: number;
  maxExecutionTimeMs?: number;
}

export interface ResearchAgentInput {
  question: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  onEvent?: (event: StreamEvent) => void;
}

export interface ResearchAgentResult {
  structuredResearch: StructuredResearch;
  toolCallsCount: number;
  searchCallsCount: number;
  pagesOpenedCount: number;
  executionTimeMs: number;
  logs: ResearchLogEntry[];
}
