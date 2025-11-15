import { useState, useEffect, useCallback, useRef } from "react";
import { Session, User, GameState, TShirtSize } from "../types";
import { api } from "../utils/api";

export const useSession = (sessionId: string, user: User) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Polling für Updates
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const updatedSession = await api.getSession(sessionId);
        setSession(updatedSession);
      } catch (err) {
        // Ignoriere Fehler beim Polling (Session könnte noch nicht existieren)
        console.error("Polling error:", err);
      }
    }, 1000); // Alle 1 Sekunde aktualisieren
  }, [sessionId]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        setLoading(true);
        setError(null);

        // Versuche Session zu laden
        try {
          const existingSession = await api.getSession(sessionId);
          // Prüfe ob User bereits in Session ist
          const userInSession = existingSession.users.some(
            (u) => u.id === user.id
          );
          if (!userInSession) {
            // User zur Session hinzufügen
            const updatedSession = await api.joinSession(sessionId, user);
            setSession(updatedSession);
          } else {
            setSession(existingSession);
          }
        } catch (err) {
          // Session existiert nicht, erstelle neue
          const newSession = await api.createSession(sessionId, user);
          setSession(newSession);
        }

        startPolling();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to initialize session"
        );
        console.error("Session initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();

    return () => {
      stopPolling();
    };
  }, [sessionId, user.id, user.name, startPolling, stopPolling]);

  const createSession = useCallback(async () => {
    try {
      const newSession = await api.createSession(sessionId, user);
      setSession(newSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session");
    }
  }, [sessionId, user]);

  const startVoting = useCallback(async () => {
    try {
      const updatedSession = await api.startVoting(sessionId);
      setSession(updatedSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start voting");
    }
  }, [sessionId]);

  const finishVoting = useCallback(async () => {
    try {
      const updatedSession = await api.finishVoting(sessionId);
      setSession(updatedSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to finish voting");
    }
  }, [sessionId]);

  const castVote = useCallback(
    async (size: TShirtSize) => {
      if (session && session.gameState === GameState.Voting) {
        try {
          const updatedSession = await api.castVote(sessionId, user.id, size);
          setSession(updatedSession);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to cast vote");
        }
      }
    },
    [session, sessionId, user.id]
  );

  return {
    session,
    loading,
    error,
    createSession,
    startVoting,
    finishVoting,
    castVote,
  };
};
