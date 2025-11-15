import { Session, User, TShirtSize } from '../types';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8888/.netlify/functions'
  : '/.netlify/functions';

export const api = {
  async getSession(sessionId: string): Promise<Session> {
    const response = await fetch(`${API_BASE}/session/${sessionId}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Session not found');
      }
      throw new Error('Failed to get session');
    }
    return response.json();
  },

  async createSession(sessionId: string, user: User): Promise<Session> {
    const response = await fetch(`${API_BASE}/session/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', user }),
    });
    if (!response.ok) {
      throw new Error('Failed to create session');
    }
    return response.json();
  },

  async joinSession(sessionId: string, user: User): Promise<Session> {
    const response = await fetch(`${API_BASE}/session/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join', user }),
    });
    if (!response.ok) {
      throw new Error('Failed to join session');
    }
    return response.json();
  },

  async startVoting(sessionId: string): Promise<Session> {
    const response = await fetch(`${API_BASE}/session/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'startVoting' }),
    });
    if (!response.ok) {
      throw new Error('Failed to start voting');
    }
    return response.json();
  },

  async finishVoting(sessionId: string): Promise<Session> {
    const response = await fetch(`${API_BASE}/session/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'finishVoting' }),
    });
    if (!response.ok) {
      throw new Error('Failed to finish voting');
    }
    return response.json();
  },

  async resetVoting(sessionId: string): Promise<Session> {
    const response = await fetch(`${API_BASE}/session/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resetVoting' }),
    });
    if (!response.ok) {
      throw new Error('Failed to reset voting');
    }
    return response.json();
  },

  async castVote(sessionId: string, userId: string, size: TShirtSize): Promise<Session> {
    const response = await fetch(`${API_BASE}/session/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'vote', userId, size }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || 'Failed to cast vote';
      throw new Error(errorMessage);
    }
    return response.json();
  },
};

