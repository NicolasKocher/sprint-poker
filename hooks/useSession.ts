import { useState, useEffect, useCallback } from 'react';
import { Session, User, GameState, TShirtSize } from '../types';
import { generateId } from '../utils/helpers';

const getSessionStorageKey = (sessionId: string) => `poker-session-${sessionId}`;

export const useSession = (sessionId: string, user: User) => {
  const [session, setSession] = useState<Session | null>(null);

  const updateLocalStorage = (newSession: Session) => {
    try {
      localStorage.setItem(getSessionStorageKey(newSession.id), JSON.stringify(newSession));
       // Manually dispatch a storage event to trigger updates in the same tab
      window.dispatchEvent(new StorageEvent('storage', {
        key: getSessionStorageKey(newSession.id),
        newValue: JSON.stringify(newSession),
      }));
    } catch (error) {
      console.error("Could not update session in local storage", error);
    }
  };

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === getSessionStorageKey(sessionId) && event.newValue) {
        setSession(JSON.parse(event.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const storedSession = localStorage.getItem(getSessionStorageKey(sessionId));
    if (storedSession) {
      const currentSession = JSON.parse(storedSession) as Session;
      const userInSession = currentSession.users.some(u => u.id === user.id);
      if (!userInSession) {
        const updatedUsers = [...currentSession.users, user];
        const updatedSession = { ...currentSession, users: updatedUsers };
        setSession(updatedSession);
        updateLocalStorage(updatedSession);
      } else {
         setSession(currentSession);
      }
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [sessionId, user.id, user.name]);

  const createSession = useCallback(() => {
    const newSession: Session = {
      id: sessionId,
      hostId: user.id,
      users: [user],
      gameState: GameState.Idle,
      votes: {},
      votingStartTime: null,
    };
    setSession(newSession);
    updateLocalStorage(newSession);
  }, [sessionId, user]);

  const startVoting = useCallback(() => {
    if (session) {
      const newSession: Session = {
        ...session,
        gameState: GameState.Voting,
        votes: {},
        votingStartTime: Date.now(),
      };
      setSession(newSession);
      updateLocalStorage(newSession);
    }
  }, [session]);
  
  const finishVoting = useCallback(() => {
    if (session) {
      const newSession = {...session, gameState: GameState.Finished };
      setSession(newSession);
      updateLocalStorage(newSession);
    }
  }, [session]);

  const castVote = useCallback((size: TShirtSize) => {
    if (session && session.gameState === GameState.Voting) {
       const newSession = {
        ...session,
        votes: {
          ...session.votes,
          [user.id]: size,
        },
      };
      setSession(newSession);
      updateLocalStorage(newSession);
    }
  }, [session, user.id]);

  return { session, createSession, startVoting, finishVoting, castVote };
};
