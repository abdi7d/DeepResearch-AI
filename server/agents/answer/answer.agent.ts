import { LLMService, defaultLLMService } from '../../llm/llm.service.js';
import { ANSWER_AGENT_SYSTEM_PROMPT } from './answer.prompt.js';
import { AnswerAgentInput, AnswerAgentResult } from './answer.types.js';

export class AnswerAgent {
  private llm: LLMService;

  constructor(llm?: LLMService) {
    this.llm = llm || defaultLLMService;
  }

  async run(input: AnswerAgentInput): Promise<AnswerAgentResult> {
    const startTime = Date.now();

    const emitEvent = (type: any, data: any) => {
      if (input.onEvent) {
        input.onEvent({ type, data });
      }
    };

    emitEvent('agent_state', {
      state: 'WRITING',
      message: 'Answer Agent synthesizing verified research into comprehensive response...',
    });
    emitEvent('answer_started', {
      sourcesCount: input.research.sources.length,
      findingsCount: input.research.keyFindings.length,
    });

    // Format research for prompt
    let researchContext = `USER QUESTION: "${input.question}"\n\n`;
    researchContext += `RESEARCH SUMMARY:\n${input.research.researchSummary}\n\n`;

    researchContext += `KEY RESEARCH FINDINGS:\n`;
    for (const finding of input.research.keyFindings) {
      researchContext += `- Claim: ${finding.claim}\n  Evidence: ${finding.evidence}\n  Source IDs: ${finding.sourceIds.join(', ')}\n`;
    }
    researchContext += `\n`;

    if (input.research.conflicts && input.research.conflicts.length > 0) {
      researchContext += `IDENTIFIED CONFLICTS / DEBATES:\n`;
      for (const c of input.research.conflicts) {
        researchContext += `- ${c}\n`;
      }
      researchContext += `\n`;
    }

    researchContext += `AVAILABLE SOURCES (Match citations [index] exactly to these):\n`;
    input.research.sources.forEach((s) => {
      researchContext += `[${s.index}] ${s.title} (${s.domain})\n    URL: ${s.url}\n    Summary: ${s.snippet || 'Primary document'}\n`;
    });

    // Context history
    const history: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    if (input.conversationHistory && input.conversationHistory.length > 0) {
      for (const m of input.conversationHistory.slice(-4)) {
        history.push({
          role: m.role,
          content: m.content.substring(0, 400),
        });
      }
    }

    let fullAnswer = '';

    const stream = this.llm.stream(researchContext, history, {
      systemInstruction: ANSWER_AGENT_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    for await (const chunk of stream) {
      fullAnswer += chunk;
      if (input.onChunk) {
        input.onChunk(chunk);
      }
      emitEvent('answer_chunk', { chunk });
    }

    emitEvent('agent_state', { state: 'COMPLETED', message: 'Synthesis complete.' });
    emitEvent('answer_completed', {
      answer: fullAnswer,
      sources: input.research.sources,
      executionTimeMs: Date.now() - startTime,
    });

    return {
      answer: fullAnswer,
      citations: input.research.sources,
      executionTimeMs: Date.now() - startTime,
    };
  }
}

export const defaultAnswerAgent = new AnswerAgent();
