import { User, Conversation, Message } from '../types/client.types.js';

const API_BASE = '/api';

export const api = {
  // --- AUTH ---
  async me(): Promise<{ user: User } | null> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`);
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  async register(name: string, email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  },

  async guest(): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/guest`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Guest login failed');
    return res.json();
  },

  async logout(): Promise<void> {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
  },

  // --- CONVERSATIONS ---
  async getConversations(query?: string): Promise<Conversation[]> {
    const url = query ? `${API_BASE}/conversations?q=${encodeURIComponent(query)}` : `${API_BASE}/conversations`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.conversations || [];
  },

  async getConversation(id: string): Promise<{ conversation: Conversation; messages: Message[] }> {
    const res = await fetch(`${API_BASE}/conversations/${id}`);
    if (!res.ok) throw new Error('Failed to load conversation');
    return res.json();
  },

  async deleteConversation(id: string): Promise<void> {
    await fetch(`${API_BASE}/conversations/${id}`, { method: 'DELETE' });
  },

  // --- RESEARCH RUN DETAILS ---
  async getResearchRun(runId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/research/${runId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.run;
  },

  // --- STREAMING CHAT (SSE) ---
  async streamChat(options: {
    message: string;
    conversationId?: string;
    onEvent: (event: any) => void;
    signal?: AbortSignal;
  }): Promise<void> {
    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: options.message,
        conversationId: options.conversationId,
      }),
      signal: options.signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported by browser.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmed.substring(6));
            options.onEvent(json);
          } catch {
            // ignore partial JSON
          }
        }
      }
    }

    if (buffer.trim().startsWith('data: ')) {
      try {
        const json = JSON.parse(buffer.trim().substring(6));
        options.onEvent(json);
      } catch {}
    }
  },
};
