import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { ConversationController } from '../controllers/conversation.controller.js';
import { ChatController } from '../controllers/chat.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'DeepResearch AI | Agentic AI Web Research System',
    timestamp: new Date().toISOString(),
  });
});

// Auth Routes
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.post('/auth/guest', AuthController.guest);
router.post('/auth/logout', AuthController.logout);
router.get('/auth/me', authMiddleware, AuthController.me);

// Conversation Routes
router.get('/conversations', authMiddleware, ConversationController.list);
router.get('/conversations/:id', authMiddleware, ConversationController.get);
router.delete('/conversations/:id', authMiddleware, ConversationController.delete);

// Chat & Research Routes
router.post('/chat/stream', authMiddleware, ChatController.stream);
router.post('/chat', authMiddleware, ChatController.chat);
router.get('/research/:runId', authMiddleware, ChatController.getResearchRun);

export default router;
