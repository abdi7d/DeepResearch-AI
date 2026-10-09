import { Response } from 'express';
import { defaultOrchestrator } from '../orchestration/chat.orchestrator.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { db } from '../models/store.js';

export class ChatController {
  /**
   * SSE Streaming Chat Endpoint
   */
  static async stream(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { message, conversationId } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ error: 'A valid question or message is required.' });
      return;
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering
    res.flushHeaders();

    let isClientConnected = true;
    req.on('close', () => {
      isClientConnected = false;
    });

    const sendEvent = (event: { type: string; data: any }) => {
      if (!isClientConnected) return;
      res.write(`data: ${JSON.stringify(event)}\n\n`);
      // Flush if method exists
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    };

    try {
      const userId = req.user?.id || 'guest_user';

      await defaultOrchestrator.processQuestion({
        question: message.trim(),
        conversationId,
        userId,
        onEvent: (event) => {
          sendEvent(event);
        },
      });

      sendEvent({ type: 'stream_end', data: { success: true } });
      res.end();
    } catch (error: any) {
      console.error('[ChatController.stream] Error during orchestration:', error);
      sendEvent({
        type: 'error',
        data: {
          message: error.message || 'An error occurred during web research and answer generation.',
        },
      });
      res.end();
    }
  }

  /**
   * Synchronous JSON chat endpoint
   */
  static async chat(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { message, conversationId } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ error: 'A valid message is required.' });
      return;
    }

    try {
      const userId = req.user?.id || 'guest_user';
      const result = await defaultOrchestrator.processQuestion({
        question: message.trim(),
        conversationId,
        userId,
      });

      res.json(result);
    } catch (error: any) {
      console.error('[ChatController.chat] Error:', error);
      res.status(500).json({ error: error.message || 'Research workflow failed.' });
    }
  }

  /**
   * Get Research Run details by Run ID
   */
  static async getResearchRun(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { runId } = req.params;
      const run = await db.researchRuns.findById(runId);
      if (!run) {
        res.status(404).json({ error: 'Research run not found.' });
        return;
      }
      res.json({ run });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch research run.' });
    }
  }
}
