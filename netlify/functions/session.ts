import type { Handler } from '@netlify/functions';
import { Session, User, GameState, TShirtSize } from '../../types';

// In-Memory Store (für Produktion sollte eine Datenbank verwendet werden)
const sessions: Map<string, Session> = new Map();

export const handler: Handler = async (event, context) => {
  const { httpMethod, path, body } = event;
  const sessionId = path.split('/').pop()?.toUpperCase();

  if (!sessionId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Session ID required' }),
    };
  }

  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (httpMethod === 'GET') {
      // Session abrufen
      const session = sessions.get(sessionId);
      if (!session) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Session not found' }),
        };
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(session),
      };
    }

    if (httpMethod === 'POST') {
      // Session erstellen oder aktualisieren
      const data = JSON.parse(body || '{}');
      
      if (data.action === 'create') {
        const { user } = data;
        const newSession: Session = {
          id: sessionId,
          hostId: user.id,
          users: [user],
          gameState: GameState.Idle,
          votes: {},
          votingStartTime: null,
        };
        sessions.set(sessionId, newSession);
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(newSession),
        };
      }

      if (data.action === 'join') {
        const { user } = data;
        const session = sessions.get(sessionId);
        if (!session) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Session not found' }),
          };
        }
        const userExists = session.users.some(u => u.id === user.id);
        if (!userExists) {
          session.users.push(user);
          sessions.set(sessionId, session);
        }
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(session),
        };
      }

      if (data.action === 'startVoting') {
        const session = sessions.get(sessionId);
        if (!session) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Session not found' }),
          };
        }
        // Erlaube Start nur wenn im Idle State
        if (session.gameState !== GameState.Idle) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: `Cannot start voting. Current state: ${session.gameState}` }),
          };
        }
        session.gameState = GameState.Voting;
        session.votes = {};
        session.votingStartTime = Date.now();
        sessions.set(sessionId, session);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(session),
        };
      }

      if (data.action === 'finishVoting') {
        const session = sessions.get(sessionId);
        if (!session) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Session not found' }),
          };
        }
        session.gameState = GameState.Finished;
        sessions.set(sessionId, session);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(session),
        };
      }

      if (data.action === 'resetVoting') {
        const session = sessions.get(sessionId);
        if (!session) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Session not found' }),
          };
        }
        session.gameState = GameState.Idle;
        session.votes = {};
        session.votingStartTime = null;
        sessions.set(sessionId, session);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(session),
        };
      }

      if (data.action === 'vote') {
        const { userId, size } = data;
        const session = sessions.get(sessionId);
        if (!session) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Session not found' }),
          };
        }
        if (session.gameState !== GameState.Voting) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Voting is not active' }),
          };
        }
        session.votes[userId] = size;
        sessions.set(sessionId, session);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(session),
        };
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

