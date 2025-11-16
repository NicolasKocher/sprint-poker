import { Session, User, TShirtSize } from '../types';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8888/.netlify/functions'
  : '/.netlify/functions';

const getErrorMessage = async (response: Response, fallback: string) => {
  try {
    const data = await response.json();
    if (data?.error) {
      return data.details ? `${data.error}: ${data.details}` : data.error;
    }
  } catch {
    // ignore JSON parsing errors
  }
  return fallback;
};

export const api = {
  async getSession(sessionId: string): Promise<Session> {
    const response = await fetch(`${API_BASE}/session/${sessionId}`);
    if (!response.ok) {
      const message = response.status === 404
        ? 'Session not found'
        : await getErrorMessage(response, 'Failed to get session');
      throw new Error(message);
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
      throw new Error(await getErrorMessage(response, 'Failed to create session'));
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
      throw new Error(await getErrorMessage(response, 'Failed to join session'));
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
      throw new Error(await getErrorMessage(response, 'Failed to start voting'));
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
      throw new Error(await getErrorMessage(response, 'Failed to finish voting'));
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
      throw new Error(await getErrorMessage(response, 'Failed to reset voting'));
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
      throw new Error(await getErrorMessage(response, 'Failed to cast vote'));
    }
    return response.json();
  },

  async leaveSession(sessionId: string, userId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/session/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'leave', userId }),
    });
    if (!response.ok && response.status !== 404) {
      throw new Error(await getErrorMessage(response, 'Failed to leave session'));
    }
  },

  leaveSessionWithBeacon(sessionId: string, userId: string): boolean {
    if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') {
      return false;
    }

    const payload = JSON.stringify({ action: 'leave', userId });
    const body =
      typeof Blob !== 'undefined'
        ? new Blob([payload], { type: 'application/json' })
        : payload;

    return navigator.sendBeacon(`${API_BASE}/session/${sessionId}`, body);
  },
};
