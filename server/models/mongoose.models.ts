import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const ConversationSchema = new Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const SourceSchema = new Schema({
  id: { type: String, required: true },
  index: { type: Number, required: true },
  title: { type: String, required: true },
  url: { type: String, required: true },
  domain: { type: String, required: true },
  snippet: { type: String },
  publishedAt: { type: String },
  relevance: { type: String, enum: ['high', 'medium', 'low'], default: 'high' },
});

const MessageSchema = new Schema({
  conversationId: { type: String, required: true, index: true },
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  sources: [SourceSchema],
  researchRunId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const ResearchRunSchema = new Schema({
  conversationId: { type: String, required: true, index: true },
  messageId: { type: String },
  question: { type: String, required: true },
  toolCallsCount: { type: Number, default: 0 },
  searchCallsCount: { type: Number, default: 0 },
  pagesOpenedCount: { type: Number, default: 0 },
  structuredResearch: { type: Schema.Types.Mixed },
  logs: [{ type: Schema.Types.Mixed }],
  executionTimeMs: { type: Number, default: 0 },
  status: { type: String, enum: ['completed', 'failed', 'limited'], default: 'completed' },
  createdAt: { type: Date, default: Date.now },
});

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export const ConversationModel = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
export const MessageModel = mongoose.models.Message || mongoose.model('Message', MessageSchema);
export const ResearchRunModel = mongoose.models.ResearchRun || mongoose.model('ResearchRun', ResearchRunSchema);
export const SourceModel = mongoose.models.Source || mongoose.model('Source', SourceSchema);
