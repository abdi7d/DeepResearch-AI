import crypto from 'crypto';
import { isUsingMongoose } from '../config/database.js';
import {
  UserModel,
  ConversationModel,
  MessageModel,
  ResearchRunModel,
} from './mongoose.models.js';
import type {
  UserDocument,
  ConversationDocument,
  MessageDocument,
  ResearchRunDocument,
  SourceReference,
  StructuredResearch,
} from '../types/index.js';

// In-memory persistent state fallback
const memUsers = new Map<string, UserDocument>();
const memConversations = new Map<string, ConversationDocument>();
const memMessages = new Map<string, MessageDocument>();
const memResearchRuns = new Map<string, ResearchRunDocument>();

// Helper ID generator
export function generateId(): string {
  return crypto.randomUUID();
}

export const db = {
  // --- USERS ---
  users: {
    async findByEmail(email: string): Promise<UserDocument | null> {
      if (isUsingMongoose()) {
        const doc = await UserModel.findOne({ email }).lean();
        if (!doc) return null;
        return {
          id: (doc as any)._id.toString(),
          email: doc.email,
          passwordHash: doc.passwordHash,
          name: doc.name,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        };
      }
      for (const u of memUsers.values()) {
        if (u.email.toLowerCase() === email.toLowerCase()) return u;
      }
      return null;
    },

    async findById(id: string): Promise<UserDocument | null> {
      if (isUsingMongoose()) {
        const doc = await UserModel.findById(id).lean();
        if (!doc) return null;
        return {
          id: (doc as any)._id.toString(),
          email: doc.email,
          passwordHash: doc.passwordHash,
          name: doc.name,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        };
      }
      return memUsers.get(id) || null;
    },

    async create(data: Omit<UserDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserDocument> {
      const now = new Date();
      if (isUsingMongoose()) {
        const doc = await UserModel.create({
          ...data,
          createdAt: now,
          updatedAt: now,
        });
        return {
          id: doc._id.toString(),
          email: doc.email,
          passwordHash: doc.passwordHash,
          name: doc.name,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        };
      }
      const id = generateId();
      const user: UserDocument = {
        id,
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      memUsers.set(id, user);
      return user;
    },
  },

  // --- CONVERSATIONS ---
  conversations: {
    async findByUserId(userId: string): Promise<ConversationDocument[]> {
      if (isUsingMongoose()) {
        const docs = await ConversationModel.find({ userId }).sort({ updatedAt: -1 }).lean();
        return docs.map((doc: any) => ({
          id: doc._id.toString(),
          userId: doc.userId,
          title: doc.title,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        }));
      }
      const results: ConversationDocument[] = [];
      for (const c of memConversations.values()) {
        if (c.userId === userId) results.push(c);
      }
      return results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    },

    async findById(id: string): Promise<ConversationDocument | null> {
      if (isUsingMongoose()) {
        const doc = await ConversationModel.findById(id).lean();
        if (!doc) return null;
        return {
          id: (doc as any)._id.toString(),
          userId: (doc as any).userId,
          title: (doc as any).title,
          createdAt: (doc as any).createdAt,
          updatedAt: (doc as any).updatedAt,
        };
      }
      return memConversations.get(id) || null;
    },

    async create(userId: string, title: string): Promise<ConversationDocument> {
      const now = new Date();
      if (isUsingMongoose()) {
        const doc = await ConversationModel.create({
          userId,
          title,
          createdAt: now,
          updatedAt: now,
        });
        return {
          id: doc._id.toString(),
          userId: doc.userId,
          title: doc.title,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        };
      }
      const id = generateId();
      const conv: ConversationDocument = {
        id,
        userId,
        title,
        createdAt: now,
        updatedAt: now,
      };
      memConversations.set(id, conv);
      return conv;
    },

    async updateTitle(id: string, title: string): Promise<void> {
      const now = new Date();
      if (isUsingMongoose()) {
        await ConversationModel.findByIdAndUpdate(id, { title, updatedAt: now });
        return;
      }
      const conv = memConversations.get(id);
      if (conv) {
        conv.title = title;
        conv.updatedAt = now;
      }
    },

    async delete(id: string): Promise<boolean> {
      if (isUsingMongoose()) {
        await ConversationModel.findByIdAndDelete(id);
        await MessageModel.deleteMany({ conversationId: id });
        await ResearchRunModel.deleteMany({ conversationId: id });
        return true;
      }
      memConversations.delete(id);
      for (const [mId, m] of memMessages.entries()) {
        if (m.conversationId === id) memMessages.delete(mId);
      }
      for (const [rId, r] of memResearchRuns.entries()) {
        if (r.conversationId === id) memResearchRuns.delete(rId);
      }
      return true;
    },

    async search(
      userId: string,
      query: string
    ): Promise<Array<ConversationDocument & { snippet?: string; matchType?: 'title' | 'content' }>> {
      const q = query.toLowerCase();
      const allConvs = await this.findByUserId(userId);
      const results: Array<ConversationDocument & { snippet?: string; matchType?: 'title' | 'content' }> = [];

      for (const conv of allConvs) {
        // 1. Check title match
        if (conv.title.toLowerCase().includes(q)) {
          results.push({
            ...conv,
            matchType: 'title',
          });
          continue;
        }

        // 2. Check message contents
        const messages = await db.messages.findByConversationId(conv.id);
        let foundSnippet: string | undefined;
        for (const m of messages) {
          const idx = m.content.toLowerCase().indexOf(q);
          if (idx !== -1) {
            const start = Math.max(0, idx - 40);
            const end = Math.min(m.content.length, idx + query.length + 60);
            const prefix = start > 0 ? '...' : '';
            const suffix = end < m.content.length ? '...' : '';
            foundSnippet = prefix + m.content.substring(start, end).replace(/\n+/g, ' ').trim() + suffix;
            break;
          }
        }

        if (foundSnippet) {
          results.push({
            ...conv,
            snippet: foundSnippet,
            matchType: 'content',
          });
        }
      }

      return results;
    },
  },

  // --- MESSAGES ---
  messages: {
    async findByConversationId(conversationId: string): Promise<MessageDocument[]> {
      if (isUsingMongoose()) {
        const docs = await MessageModel.find({ conversationId }).sort({ createdAt: 1 }).lean();
        return docs.map((doc: any) => ({
          id: doc._id.toString(),
          conversationId: doc.conversationId,
          role: doc.role,
          content: doc.content,
          sources: doc.sources,
          researchRunId: doc.researchRunId,
          createdAt: doc.createdAt,
        }));
      }
      const list: MessageDocument[] = [];
      for (const m of memMessages.values()) {
        if (m.conversationId === conversationId) list.push(m);
      }
      return list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    },

    async create(data: {
      conversationId: string;
      role: 'user' | 'assistant' | 'system';
      content: string;
      sources?: SourceReference[];
      researchRunId?: string;
    }): Promise<MessageDocument> {
      const now = new Date();
      if (isUsingMongoose()) {
        const doc = await MessageModel.create({
          ...data,
          createdAt: now,
        });
        await ConversationModel.findByIdAndUpdate(data.conversationId, { updatedAt: now });
        return {
          id: doc._id.toString(),
          conversationId: doc.conversationId,
          role: doc.role,
          content: doc.content,
          sources: doc.sources,
          researchRunId: doc.researchRunId,
          createdAt: doc.createdAt,
        };
      }
      const id = generateId();
      const message: MessageDocument = {
        id,
        ...data,
        createdAt: now,
      };
      memMessages.set(id, message);
      const conv = memConversations.get(data.conversationId);
      if (conv) conv.updatedAt = now;
      return message;
    },
  },

  // --- RESEARCH RUNS ---
  researchRuns: {
    async create(data: Omit<ResearchRunDocument, 'id' | 'createdAt'>): Promise<ResearchRunDocument> {
      const now = new Date();
      if (isUsingMongoose()) {
        const doc = await ResearchRunModel.create({
          ...data,
          createdAt: now,
        });
        return {
          id: doc._id.toString(),
          conversationId: doc.conversationId,
          messageId: doc.messageId,
          question: doc.question,
          toolCallsCount: doc.toolCallsCount,
          searchCallsCount: doc.searchCallsCount,
          pagesOpenedCount: doc.pagesOpenedCount,
          structuredResearch: doc.structuredResearch,
          logs: doc.logs,
          executionTimeMs: doc.executionTimeMs,
          status: doc.status,
          createdAt: doc.createdAt,
        };
      }
      const id = generateId();
      const run: ResearchRunDocument = {
        id,
        ...data,
        createdAt: now,
      };
      memResearchRuns.set(id, run);
      return run;
    },

    async findById(id: string): Promise<ResearchRunDocument | null> {
      if (isUsingMongoose()) {
        const doc = await ResearchRunModel.findById(id).lean();
        if (!doc) return null;
        return {
          id: (doc as any)._id.toString(),
          conversationId: (doc as any).conversationId,
          messageId: (doc as any).messageId,
          question: (doc as any).question,
          toolCallsCount: (doc as any).toolCallsCount,
          searchCallsCount: (doc as any).searchCallsCount,
          pagesOpenedCount: (doc as any).pagesOpenedCount,
          structuredResearch: (doc as any).structuredResearch,
          logs: (doc as any).logs,
          executionTimeMs: (doc as any).executionTimeMs,
          status: (doc as any).status,
          createdAt: (doc as any).createdAt,
        };
      }
      return memResearchRuns.get(id) || null;
    },
  },
};
