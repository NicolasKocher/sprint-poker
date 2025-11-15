export const generateId = (length = 6) => {
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
};

const USER_ID_STORAGE_KEY = "sprint-poker-user-ids";

const normalizeName = (name: string) => name.trim().toLowerCase();

const getStoredUserIds = (): Record<string, string> => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(USER_ID_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const persistUserIds = (ids: Record<string, string>) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(USER_ID_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage errors (private mode, quota exceeded, etc.)
  }
};

export const getPersistentUserId = (name: string) => {
  const normalized = normalizeName(name);

  if (!normalized) {
    return generateId(12);
  }

  const storedIds = getStoredUserIds();
  const existingId = storedIds[normalized];
  if (existingId) {
    return existingId;
  }

  const newId = generateId(12);
  storedIds[normalized] = newId;
  persistUserIds(storedIds);
  return newId;
};
