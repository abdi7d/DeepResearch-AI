import { ResearchAgent } from '../agents/research/research.agent.js';
import { AnswerAgent } from '../agents/answer/answer.agent.js';
import { db } from '../models/store.js';
import { StreamEvent, SourceReference, StructuredResearch } from '../types/index.js';

export interface OrchestratorRunInput {
  question: string;
  conversationId?: string;
  userId: string;
  onEvent?: (event: StreamEvent) => void;
}

export interface OrchestratorRunResult {
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  answer: string;
  sources: SourceReference[];
  structuredResearch: StructuredResearch;
  executionTimeMs: number;
}

export class ChatOrchestrator {
  private researchAgent: ResearchAgent;
  private answerAgent: AnswerAgent;

  constructor() {
    this.researchAgent = new ResearchAgent();
    this.answerAgent = new AnswerAgent();
  }

  async processQuestion(input: OrchestratorRunInput): Promise<OrchestratorRunResult> {
    const startTime = Date.now();
    const emit = (event: StreamEvent) => {
      if (input.onEvent) {
        input.onEvent(event);
      }
    };

    // 1. Resolve or create conversation
    let convId = input.conversationId;
    let isNewConv = false;

    if (!convId) {
      // Generate clean title (first 40 chars of question)
      const title =
        input.question.length > 45
          ? input.question.substring(0, 42).trim() + '...'
          : input.question;
      const conv = await db.conversations.create(input.userId, title);
      convId = conv.id;
      isNewConv = true;
    }

    emit({
      type: 'conversation_updated',
      data: { conversationId: convId, isNew: isNewConv },
    });

    // 2. Persist user message
    const userMsg = await db.messages.create({
      conversationId: convId,
      role: 'user',
      content: input.question,
    });

    // 3. Fetch recent conversation history for context awareness
    const historyDocs = await db.messages.findByConversationId(convId);
    const history = historyDocs
      .filter((m) => m.id !== userMsg.id)
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // 4. Run Agent 1: Research Agent
    const researchResult = await this.researchAgent.run({
      question: input.question,
      conversationHistory: history,
      onEvent: emit,
    });

    // 5. Run Agent 2: Answer Agent
    const answerResult = await this.answerAgent.run({
      question: input.question,
      research: researchResult.structuredResearch,
      conversationHistory: history,
      onEvent: emit,
    });

    // 6. Save Research Run Telemetry
    const researchRun = await db.researchRuns.create({
      conversationId: convId,
      question: input.question,
      toolCallsCount: researchResult.toolCallsCount,
      searchCallsCount: researchResult.searchCallsCount,
      pagesOpenedCount: researchResult.pagesOpenedCount,
      structuredResearch: researchResult.structuredResearch,
      logs: researchResult.logs,
      executionTimeMs: researchResult.executionTimeMs,
      status: 'completed',
    });

    // 7. Persist Assistant Message
    const assistantMsg = await db.messages.create({
      conversationId: convId,
      role: 'assistant',
      content: answerResult.answer,
      sources: researchResult.structuredResearch.sources,
      researchRunId: researchRun.id,
    });

    return {
      conversationId: convId,
      userMessageId: userMsg.id,
      assistantMessageId: assistantMsg.id,
      answer: answerResult.answer,
      sources: researchResult.structuredResearch.sources,
      structuredResearch: researchResult.structuredResearch,
      executionTimeMs: Date.now() - startTime,
    };
  }
}

export const defaultOrchestrator = new ChatOrchestrator();
