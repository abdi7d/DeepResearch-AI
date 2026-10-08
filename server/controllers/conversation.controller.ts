import { Response } from 'express';
import { db } from '../models/store.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class ConversationController {
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'guest_user';
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      if (q) {
        const conversations = await db.conversations.search(userId, q);
        res.json({ conversations });
      } else {
        const conversations = await db.conversations.findByUserId(userId);
        res.json({ conversations });
      }
    } catch (error) {
      console.error('[ConversationController.list] Error:', error);
      res.status(500).json({ error: 'Failed to fetch conversations.' });
    }
  }

  static async get(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const conversation = await db.conversations.findById(id);

      if (!conversation) {
        res.status(404).json({ error: 'Conversation not found.' });
        return;
      }

      // Check user authorization if not guest or matching userId
      const userId = req.user?.id || 'guest_user';
      if (!req.user?.isGuest && conversation.userId !== userId) {
        res.status(403).json({ error: 'Access denied.' });
        return;
      }

      const messages = await db.messages.findByConversationId(id);
      res.json({ conversation, messages });
    } catch (error) {
      console.error('[ConversationController.get] Error:', error);
      res.status(500).json({ error: 'Failed to fetch conversation.' });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const conversation = await db.conversations.findById(id);

      if (!conversation) {
        res.status(404).json({ error: 'Conversation not found.' });
        return;
      }

      const userId = req.user?.id || 'guest_user';
      if (!req.user?.isGuest && conversation.userId !== userId) {
        res.status(403).json({ error: 'Access denied.' });
        return;
      }

      await db.conversations.delete(id);
      res.json({ success: true, message: 'Conversation deleted.' });
    } catch (error) {
      console.error('[ConversationController.delete] Error:', error);
      res.status(500).json({ error: 'Failed to delete conversation.' });
    }
  }
}
