import { supabase, isSupabaseConfigured } from "./client";
import { RecordingSession } from "../../types/recording";
import * as FileSystem from "expo-file-system/legacy";

// Table name in Supabase
const SESSIONS_TABLE = "speech_sessions";
const AUDIO_BUCKET = "audio-recordings";

export interface SupabaseSession {
  id: string;
  created_at: string;
  audio_url: string | null;
  duration: number;
  transcription: any | null;
  analysis: any | null;
  user_id: string | null;
  ai_feedback: any | null;
  practice_mode: string | null;
  template_id: string | null;
  challenge_type: string | null;
  target_duration: number | null;
  challenge_score: number | null;
  title: string | null;
}

/**
 * Upload audio file to Supabase Storage
 */
export async function uploadAudio(
  localUri: string,
  sessionId: string
): Promise<string | null> {
  if (!isSupabaseConfigured() || !supabase) {
    console.log("Supabase not configured, skipping audio upload");
    return null;
  }

  try {
    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: "base64",
    });

    // Convert to blob/arraybuffer
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    const fileName = `${sessionId}.m4a`;

    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(fileName, byteArray, {
        contentType: "audio/m4a",
        upsert: true,
      });

    if (error) {
      console.error("Error uploading audio:", error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(AUDIO_BUCKET)
      .getPublicUrl(fileName);

    return urlData?.publicUrl || null;
  } catch (error) {
    console.error("Error uploading audio:", error);
    return null;
  }
}

/**
 * Save session to Supabase
 */
export async function saveSession(session: RecordingSession): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    console.log("Supabase not configured, using local storage only");
    return false;
  }

  try {
    // Upload audio if we have a local URI
    let audioUrl: string | null = null;
    if (session.audioUri && session.audioUri.startsWith("file://")) {
      audioUrl = await uploadAudio(session.audioUri, session.id);
    }

    const { error } = await supabase.from(SESSIONS_TABLE).upsert({
      id: session.id,
      created_at: session.createdAt,
      audio_url: audioUrl,
      duration: session.duration,
      transcription: session.transcription,
      analysis: session.analysis,
      ai_feedback: session.aiFeedback,
      practice_mode: session.practiceMode || null,
      template_id: session.templateId || null,
      challenge_type: session.challengeType || null,
      target_duration: session.targetDuration || null,
      challenge_score: session.challengeScore || null,
      title: session.title || null,
      user_id: null, // Will be set when auth is implemented
    });

    if (error) {
      console.error("Error saving session to Supabase:", error);
      return false;
    }

    console.log("Session saved to Supabase:", session.id);
    return true;
  } catch (error) {
    console.error("Error saving session:", error);
    return false;
  }
}

/**
 * Update session in Supabase
 */
export async function updateSupabaseSession(
  id: string,
  updates: Partial<RecordingSession>
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    return false;
  }

  try {
    const updateData: Record<string, any> = {};
    if (updates.transcription !== undefined) updateData.transcription = updates.transcription;
    if (updates.analysis !== undefined) updateData.analysis = updates.analysis;
    if (updates.aiFeedback !== undefined) updateData.ai_feedback = updates.aiFeedback;
    if (updates.challengeScore !== undefined) updateData.challenge_score = updates.challengeScore;
    if (updates.title !== undefined) updateData.title = updates.title;

    const { error } = await supabase
      .from(SESSIONS_TABLE)
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Error updating session in Supabase:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error updating session:", error);
    return false;
  }
}

/**
 * Get all sessions from Supabase
 */
export async function getSupabaseSessions(): Promise<RecordingSession[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from(SESSIONS_TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sessions from Supabase:", error);
      return [];
    }

    // Transform Supabase data to RecordingSession format
    return (data || []).map((row: SupabaseSession) => ({
      id: row.id,
      createdAt: row.created_at,
      audioUri: row.audio_url || "",
      duration: row.duration,
      transcription: row.transcription,
      analysis: row.analysis,
      aiFeedback: row.ai_feedback,
      practiceMode: row.practice_mode as any,
      templateId: row.template_id as any,
      challengeType: row.challenge_type as any,
      targetDuration: row.target_duration || undefined,
      challengeScore: row.challenge_score || undefined,
      title: row.title || undefined,
    }));
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }
}

/**
 * Get a single session from Supabase
 */
export async function getSupabaseSession(
  id: string
): Promise<RecordingSession | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from(SESSIONS_TABLE)
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      createdAt: data.created_at,
      audioUri: data.audio_url || "",
      duration: data.duration,
      transcription: data.transcription,
      analysis: data.analysis,
      aiFeedback: data.ai_feedback,
      practiceMode: data.practice_mode as any,
      templateId: data.template_id as any,
      challengeType: data.challenge_type as any,
      targetDuration: data.target_duration || undefined,
      challengeScore: data.challenge_score || undefined,
      title: data.title || undefined,
    };
  } catch (error) {
    console.error("Error fetching session:", error);
    return null;
  }
}

/**
 * Delete a session from Supabase
 */
export async function deleteSupabaseSession(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    return false;
  }

  try {
    // Delete audio file first
    await supabase.storage.from(AUDIO_BUCKET).remove([`${id}.m4a`]);

    // Delete session record
    const { error } = await supabase
      .from(SESSIONS_TABLE)
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting session from Supabase:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting session:", error);
    return false;
  }
}
