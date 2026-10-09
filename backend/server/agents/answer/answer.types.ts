import {
  StructuredResearch,
  SourceReference,
  StreamEvent,
} from '../../types/index.js';

export interface AnswerAgentInput {
  question: string;
  research: StructuredResearch;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  onChunk?: (chunk: string) => void;
  onEvent?: (event: StreamEvent) => void;
}

export interface AnswerAgentResult {
  answer: string;
  citations: SourceReference[];
  executionTimeMs: number;
}
