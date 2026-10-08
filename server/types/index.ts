export interface UserDocument {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationDocument {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageDocument {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: SourceReference[];
  researchRunId?: string;
  createdAt: Date;
}

export interface SourceReference {
  id: string; // e.g. "source_1"
  index: number; // 1, 2, 3
  title: string;
  url: string;
  domain: string;
  snippet?: string;
  publishedAt?: string;
  relevance: 'high' | 'medium' | 'low';
}

export interface ResearchFinding {
  claim: string;
  evidence: string;
  sourceIds: string[];
}

export interface StructuredResearch {
  question: string;
  researchSummary: string;
  keyFindings: ResearchFinding[];
  sources: SourceReference[];
  conflicts: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface ResearchRunDocument {
  id: string;
  conversationId: string;
  messageId?: string;
  question: string;
  toolCallsCount: number;
  searchCallsCount: number;
  pagesOpenedCount: number;
  structuredResearch?: StructuredResearch;
  logs: ResearchLogEntry[];
  executionTimeMs: number;
  status: 'completed' | 'failed' | 'limited';
  createdAt: Date;
}

export interface ResearchLogEntry {
  timestamp: number;
  type: string;
  agent: 'research' | 'answer' | 'orchestrator';
  tool?: string;
  input?: unknown;
  outputSummary?: string;
  message: string;
}

export type AgentState =
  | 'IDLE'
  | 'UNDERSTANDING'
  | 'SEARCHING'
  | 'READING'
  | 'EVALUATING'
  | 'RESEARCH_COMPLETE'
  | 'WRITING'
  | 'COMPLETED'
  | 'FAILED';

export interface StreamEvent {
  type:
    | 'agent_state'
    | 'research_started'
    | 'search_started'
    | 'search_completed'
    | 'source_found'
    | 'page_opening'
    | 'page_opened'
    | 'research_progress'
    | 'research_completed'
    | 'answer_started'
    | 'answer_chunk'
    | 'answer_completed'
    | 'conversation_updated'
    | 'error';
  data: any;
}
