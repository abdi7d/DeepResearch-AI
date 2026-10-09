export interface SourceReference {
  id: string;
  index: number;
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

export interface ResearchLogEntry {
  timestamp: number;
  type: string;
  agent: 'research' | 'answer' | 'orchestrator';
  tool?: string;
  input?: unknown;
  outputSummary?: string;
  message: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: SourceReference[];
  researchRunId?: string;
  structuredResearch?: StructuredResearch;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  snippet?: string;
  matchType?: 'title' | 'content';
}

export interface User {
  id: string;
  email: string;
  name: string;
  isGuest?: boolean;
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

export interface ResearchStepEvent {
  id: string;
  type: string;
  agent: 'research' | 'answer';
  title: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  timestamp: number;
  metadata?: any;
}
