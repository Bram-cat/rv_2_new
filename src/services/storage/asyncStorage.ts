import AsyncStorage from "@react-native-async-storage/async-storage";
import { RecordingSession } from "../../types/recording";

const SESSIONS_KEY_PREFIX = "@speech_pitch_sessions";

function getKey(userId?: string | null): string {
  return userId ? `${SESSIONS_KEY_PREFIX}_${userId}` : SESSIONS_KEY_PREFIX;
}

/**
 * Save all sessions to AsyncStorage
 */
export async function saveSessions(sessions: RecordingSession[], userId?: string | null): Promise<void> {
  try {
    const jsonValue = JSON.stringify(sessions);
    await AsyncStorage.setItem(getKey(userId), jsonValue);
  } catch (error) {
    console.error("Error saving sessions:", error);
    throw new Error("Failed to save sessions");
  }
}

/**
 * Load all sessions from AsyncStorage
 */
export async function loadSessions(userId?: string | null): Promise<RecordingSession[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(getKey(userId));
    if (jsonValue === null) {
      return [];
    }
    return JSON.parse(jsonValue) as RecordingSession[];
  } catch (error) {
    console.error("Error loading sessions:", error);
    return [];
  }
}

/**
 * Add a new session to storage
 */
export async function addSession(session: RecordingSession, userId?: string | null): Promise<void> {
  const sessions = await loadSessions(userId);
  sessions.unshift(session); // Add to beginning (most recent first)
  await saveSessions(sessions, userId);
}

/**
 * Update an existing session
 */
export async function updateSession(
  id: string,
  updates: Partial<RecordingSession>,
  userId?: string | null,
): Promise<void> {
  const sessions = await loadSessions(userId);
  const index = sessions.findIndex((s) => s.id === id);

  if (index === -1) {
    throw new Error(`Session with id ${id} not found`);
  }

  sessions[index] = { ...sessions[index], ...updates };
  await saveSessions(sessions, userId);
}

/**
 * Delete a session by ID
 */
export async function deleteSession(id: string, userId?: string | null): Promise<void> {
  const sessions = await loadSessions(userId);
  const filtered = sessions.filter((s) => s.id !== id);

  if (filtered.length === sessions.length) {
    throw new Error(`Session with id ${id} not found`);
  }

  await saveSessions(filtered, userId);
}

/**
 * Get a single session by ID
 */
export async function getSession(id: string, userId?: string | null): Promise<RecordingSession | null> {
  const sessions = await loadSessions(userId);
  return sessions.find((s) => s.id === id) || null;
}

/**
 * Clear all sessions (use with caution)
 */
export async function clearAllSessions(userId?: string | null): Promise<void> {
  try {
    await AsyncStorage.removeItem(getKey(userId));
  } catch (error) {
    console.error("Error clearing sessions:", error);
    throw new Error("Failed to clear sessions");
  }
}

/**
 * Get the total number of sessions
 */
export async function getSessionCount(userId?: string | null): Promise<number> {
  const sessions = await loadSessions(userId);
  return sessions.length;
}
