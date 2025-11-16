import type { Handler } from "@netlify/functions";
import { connectLambda, getStore } from "@netlify/blobs";
import { Session, GameState, TShirtSize, User } from "../../types";

const STORE_NAME = "sprint-poker-sessions";

const createStore = (
  storeName: string,
  options: { siteID?: string; token?: string } = {}
) => getStore({ name: storeName, ...options } as any);

const createStoreFromEnv = () => {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token =
    process.env.NETLIFY_BLOBS_TOKEN ||
    process.env.NETLIFY_API_TOKEN ||
    process.env.NETLIFY_AUTH_TOKEN;

  if (!siteID || !token) {
    throw new Error(
      "Netlify Blobs credentials missing. Run via `netlify dev` or set NETLIFY_SITE_ID + NETLIFY_BLOBS_TOKEN (or NETLIFY_API_TOKEN)."
    );
  }

  return createStore(STORE_NAME, { siteID, token });
};

const getStoreInstance = () => {
  try {
    return createStore(STORE_NAME);
  } catch (error) {
    const missingEnv =
      error instanceof Error && error.name === "MissingBlobsEnvironmentError";
    if (!missingEnv) {
      console.error("Store initialization error:", error);
      throw error;
    }

    return createStoreFromEnv();
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
  try {
    await store.set(session.id, JSON.stringify(session));
  } catch (error) {
    console.error(`Error saving session ${session.id}:`, error);
    throw new Error(
      `Failed to save session: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

export const handler: Handler = async (event, context) => {
  try {
    connectLambda(event as any);
  } catch (err) {
    console.warn("connectLambda failed (likely not lambda compatibility mode):", err);
  }

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
    let store;
    try {
      store = getStoreInstance();
    } catch (storeError) {
      console.error("Failed to initialize store:", storeError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Failed to initialize storage",
          details:
            storeError instanceof Error
              ? storeError.message
              : String(storeError),
        }),
      };
    }

    if (httpMethod === "GET") {
      // Session abrufen
      try {
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
      } catch (error) {
        console.error("Error getting session:", error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: "Failed to retrieve session",
            details: error instanceof Error ? error.message : String(error),
          }),
        };
      }
    }

    if (httpMethod === "POST") {
      // Session erstellen oder aktualisieren
      let data;
      try {
        data = JSON.parse(body || "{}");
      } catch (parseError) {
        console.error("Error parsing request body:", parseError);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Invalid JSON in request body" }),
        };
      }

      if (data.action === "create") {
        try {
          const { user } = data as { user: User };
          if (!user || !user.id || !user.name) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: "Invalid user data" }),
            };
          }
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
        } catch (createError) {
          console.error("Error creating session:", createError);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              error: "Failed to create session",
              details:
                createError instanceof Error
                  ? createError.message
                  : String(createError),
            }),
          };
        }
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
