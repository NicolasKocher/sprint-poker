import type { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { Session, GameState, TShirtSize, User } from "../../types";

const STORE_NAME = "sprint-poker-sessions";

const createStore = (siteID: string, token?: string) => {
  const baseOptions: Record<string, unknown> = {
    name: STORE_NAME,
    siteID,
  };

  if (token) {
    baseOptions.token = token;
  }

  return getStore(baseOptions as any);
};

// Store initialisieren: Auf Netlify sollte context.netlify.blobs.store verfügbar sein
const getStoreInstance = async (context: any) => {
  // Auf Netlify ist context.netlify.blobs.store der bevorzugte Weg
  if (context?.netlify?.blobs?.store) {
    try {
      return context.netlify.blobs.store(STORE_NAME);
    } catch (error) {
      console.warn(
        "Failed to use Netlify built-in store, falling back:",
        error
      );
    }
  }

  // Fallback: Verwende getStore mit siteID
  const siteID = context?.site?.id || process.env.NETLIFY_SITE_ID;

  if (!siteID) {
    // Auf Netlify sollte context.site.id immer verfügbar sein
    throw new Error(
      `Netlify site ID is not available. Context: ${JSON.stringify({
        hasSite: !!context?.site,
        siteId: context?.site?.id,
        hasNetlifyBlobs: !!context?.netlify?.blobs,
      })}`
    );
  }

  try {
    // Versuche mit strong consistency
    return getStore({
      name: STORE_NAME,
      siteID,
      consistency: "strong",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "BlobsConsistencyError") {
      console.warn(
        "Strong consistency not available, falling back to default consistency"
      );
      return getStore({
        name: STORE_NAME,
        siteID,
      });
    }
    // Bessere Fehlermeldung für Debugging
    console.error("Store initialization error:", error);
    throw new Error(
      `Failed to initialize Blobs store: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

const getSession = async (
  store: Awaited<ReturnType<typeof getStoreInstance>>,
  sessionId: string
): Promise<Session | null> => {
  return (await store.get(sessionId, { type: "json" })) as Session | null;
};

const saveSession = async (
  store: Awaited<ReturnType<typeof getStoreInstance>>,
  session: Session
) => {
  await store.set(session.id, JSON.stringify(session));
};

export const handler: Handler = async (event, context) => {
  const { httpMethod, path, body } = event;
  const sessionId = path.split("/").pop()?.toUpperCase();

  if (!sessionId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Session ID required" }),
    };
  }

  // CORS Headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Content-Type": "application/json",
  };

  if (httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const store = await getStoreInstance(context);

    if (httpMethod === "GET") {
      // Session abrufen
      const session = await getSession(store, sessionId);
      if (!session) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "Session not found" }),
        };
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(session),
      };
    }

    if (httpMethod === "POST") {
      // Session erstellen oder aktualisieren
      const data = JSON.parse(body || "{}");

      if (data.action === "create") {
        const { user } = data as { user: User };
        const newSession: Session = {
          id: sessionId,
          hostId: user.id,
          users: [user],
          gameState: GameState.Idle,
          votes: {},
          votingStartTime: null,
        };
        await saveSession(store, newSession);
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(newSession),
        };
      }

      if (data.action === "join") {
        const { user } = data as { user: User };
        const session = await getSession(store, sessionId);
        if (!session) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: "Session not found" }),
          };
        }
        const userIndex = session.users.findIndex((u) => u.id === user.id);
        let sessionModified = false;
        if (userIndex === -1) {
          session.users.push(user);
          sessionModified = true;
        } else if (session.users[userIndex].name !== user.name) {
          session.users[userIndex] = {
            ...session.users[userIndex],
            name: user.name,
          };
          sessionModified = true;
        }

        if (sessionModified) {
          await saveSession(store, session);
        }
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(session),
        };
      }

      if (data.action === "leave") {
        const { userId } = data as { userId: string };
        const session = await getSession(store, sessionId);
        if (!session) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: "Session not found" }),
          };
        }

        const userIndex = session.users.findIndex((u) => u.id === userId);
        if (userIndex === -1) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(session),
          };
        }

        session.users.splice(userIndex, 1);
        delete session.votes[userId];

        if (session.users.length === 0) {
          await store.delete(sessionId);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ deleted: true }),
          };
        }

        if (session.hostId === userId) {
          session.hostId = session.users[0].id;
          session.gameState = GameState.Idle;
          session.votes = {};
          session.votingStartTime = null;
        } else if (
          session.gameState === GameState.Voting &&
          Object.keys(session.votes).length === session.users.length
        ) {
          session.gameState = GameState.Finished;
        }

        await saveSession(store, session);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(session),
        };
      }

      if (data.action === "startVoting") {
        const session = await getSession(store, sessionId);
        if (!session) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: "Session not found" }),
          };
        }
        // Erlaube Start nur wenn im Idle State
        if (session.gameState !== GameState.Idle) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              error: `Cannot start voting. Current state: ${session.gameState}`,
            }),
          };
        }
        session.gameState = GameState.Voting;
        session.votes = {};
        session.votingStartTime = Date.now();
        await saveSession(store, session);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(session),
        };
      }

      if (data.action === "finishVoting") {
        const session = await getSession(store, sessionId);
        if (!session) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: "Session not found" }),
          };
        }
        session.gameState = GameState.Finished;
        await saveSession(store, session);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(session),
        };
      }

      if (data.action === "resetVoting") {
        const session = await getSession(store, sessionId);
        if (!session) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: "Session not found" }),
          };
        }
        session.gameState = GameState.Idle;
        session.votes = {};
        session.votingStartTime = null;
        await saveSession(store, session);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(session),
        };
      }

      if (data.action === "vote") {
        const { userId, size } = data as { userId: string; size: TShirtSize };
        const session = await getSession(store, sessionId);
        if (!session) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: "Session not found" }),
          };
        }
        if (session.gameState !== GameState.Voting) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "Voting is not active" }),
          };
        }
        session.votes[userId] = size;
        await saveSession(store, session);
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
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  } catch (error) {
    console.error("Function error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
