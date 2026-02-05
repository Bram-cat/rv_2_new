import AsyncStorage from "@react-native-async-storage/async-storage";
import { RecordingSession } from "../../types/recording";

const SESSIONS_KEY = "@speech_pitch_sessions";

/**
 * Save all sessions to AsyncStorage
 */
export async function saveSessions(sessions: RecordingSession[]): Promise<void> {
  try {
    const jsonValue = JSON.stringify(sessions);
    await AsyncStorage.setItem(SESSIONS_KEY, jsonValue);
  } catch (error) {
    console.error("Error saving sessions:", error);
    throw new Error("Failed to save sessions");
  }
}

/**
 * Load all sessions from AsyncStorage
 */
export async function loadSessions(): Promise<RecordingSession[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(SESSIONS_KEY);
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
export async function addSession(session: RecordingSession): Promise<void> {
  const sessions = await loadSessions();
  sessions.unshift(session); // Add to beginning (most recent first)
  await saveSessions(sessions);
}

/**
 * Update an existing session
 */
export async function updateSession(
  id: string,
  updates: Partial<RecordingSession>
): Promise<void> {
  const sessions = await loadSessions();
  const index = sessions.findIndex((s) => s.id === id);

  if (index === -1) {
    throw new Error(`Session with id ${id} not found`);
  }

  sessions[index] = { ...sessions[index], ...updates };
  await saveSessions(sessions);
}

/**
 * Delete a session by ID
 */
export async function deleteSession(id: string): Promise<void> {
  const sessions = await loadSessions();
  const filtered = sessions.filter((s) => s.id !== id);

  if (filtered.length === sessions.length) {
    throw new Error(`Session with id ${id} not found`);
  }

  await saveSessions(filtered);
}

/**
 * Get a single session by ID
 */
export async function getSession(id: string): Promise<RecordingSession | null> {
  const sessions = await loadSessions();
  return sessions.find((s) => s.id === id) || null;
}

/**
 * Clear all sessions (use with caution)
 */
export async function clearAllSessions(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SESSIONS_KEY);
  } catch (error) {
    console.error("Error clearing sessions:", error);
    throw new Error("Failed to clear sessions");
  }
}

/**
 * Get the total number of sessions
 */
export async function getSessionCount(): Promise<number> {
  const sessions = await loadSessions();
  return sessions.length;
}
