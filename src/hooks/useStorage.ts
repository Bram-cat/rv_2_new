import { useState, useEffect, useCallback } from "react";
import { RecordingSession } from "../types/recording";
import * as storage from "../services/storage/asyncStorage";
import * as supabaseStorage from "../services/supabase/sessions";
import { isSupabaseConfigured } from "../services/supabase/client";

interface StorageState {
  sessions: RecordingSession[];
  isLoading: boolean;
  error: string | null;
}

export function useStorage() {
  const [state, setState] = useState<StorageState>({
    sessions: [],
    isLoading: true,
    error: null,
  });

  // Load sessions on mount
  const loadAllSessions = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const loaded = await storage.loadSessions();
      setState({
        sessions: loaded,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to load sessions",
      }));
    }
  }, []);

  useEffect(() => {
    loadAllSessions();
  }, [loadAllSessions]);

  // Add a new session
  const addSession = useCallback(async (session: RecordingSession) => {
    try {
      // Save to local storage first
      await storage.addSession(session);
      setState((prev) => ({
        ...prev,
        sessions: [session, ...prev.sessions],
        error: null,
      }));

      // Also save to Supabase if configured (in background)
      if (isSupabaseConfigured()) {
        supabaseStorage.saveSession(session).catch(console.error);
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Failed to save session",
      }));
      throw error;
    }
  }, []);

  // Update an existing session
  const updateSession = useCallback(
    async (id: string, updates: Partial<RecordingSession>) => {
      try {
        await storage.updateSession(id, updates);
        setState((prev) => ({
          ...prev,
          sessions: prev.sessions.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
          error: null,
        }));

        // Also update in Supabase if configured (in background)
        if (isSupabaseConfigured()) {
          supabaseStorage.updateSupabaseSession(id, updates).catch(console.error);
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: "Failed to update session",
        }));
        throw error;
      }
    },
    []
  );

  // Delete a session
  const deleteSession = useCallback(async (id: string) => {
    try {
      await storage.deleteSession(id);
      setState((prev) => ({
        ...prev,
        sessions: prev.sessions.filter((s) => s.id !== id),
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Failed to delete session",
      }));
      throw error;
    }
  }, []);

  // Get a session by ID (from local state)
  const getSessionById = useCallback(
    (id: string): RecordingSession | null => {
      return state.sessions.find((s) => s.id === id) || null;
    },
    [state.sessions]
  );

  // Clear all sessions
  const clearAllSessions = useCallback(async () => {
    try {
      await storage.clearAllSessions();
      setState({
        sessions: [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Failed to clear sessions",
      }));
      throw error;
    }
  }, []);

  return {
    sessions: state.sessions,
    isLoading: state.isLoading,
    error: state.error,
    addSession,
    updateSession,
    deleteSession,
    getSessionById,
    refreshSessions: loadAllSessions,
    clearAllSessions,
  };
}
