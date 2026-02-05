import * as FileSystem from "expo-file-system/legacy";
import {
  ASSEMBLYAI_BASE_URL,
  getHeaders,
  isAssemblyAIConfigured,
} from "./client";
import { TranscriptionResult, WordTimestamp } from "./types";

/**
 * Transcribe an audio file using AssemblyAI REST API
 * @param audioUri - The local URI of the audio file
 * @returns TranscriptionResult with text and word-level timestamps
 */
export async function transcribeAudio(
  audioUri: string,
): Promise<TranscriptionResult> {
  if (!isAssemblyAIConfigured()) {
    throw new Error(
      "AssemblyAI is not configured. Please set EXPO_PUBLIC_ASSEMBLYAI_API_KEY in your .env file.",
    );
  }

  try {
    // Step 1: Upload the audio file
    const uploadUrl = await uploadAudio(audioUri);

    // Step 2: Request transcription
    const transcriptId = await requestTranscription(uploadUrl);

    // Step 3: Poll for completion
    const transcript = await pollForCompletion(transcriptId);

    // Extract word-level timestamps
    const words: WordTimestamp[] =
      transcript.words?.map((word: any) => ({
        text: word.text,
        start: word.start,
        end: word.end,
        confidence: word.confidence,
      })) || [];

    return {
      text: transcript.text || "",
      words,
      audioDuration: transcript.audio_duration || 0,
      confidence: transcript.confidence || 0,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Transcription failed: ${error.message}`);
    }
    throw new Error("Transcription failed: Unknown error");
  }
}

/**
 * Upload audio file to AssemblyAI
 */
async function uploadAudio(audioUri: string): Promise<string> {
  console.log("Starting audio upload to AssemblyAI...");
  console.log("Audio URI:", audioUri);

  try {
    // Use FileSystem.uploadAsync for proper file uploads in Expo
    const apiKey = isAssemblyAIConfigured()
      ? (getHeaders()["Authorization"] as string)
      : "";

    const uploadResponse = await FileSystem.uploadAsync(
      `${ASSEMBLYAI_BASE_URL}/upload`,
      audioUri,
      {
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: {
          Authorization: apiKey,
        },
      },
    );

    console.log("Upload response status:", uploadResponse.status);

    if (uploadResponse.status !== 200) {
      console.error("Upload error response:", uploadResponse.body);
      throw new Error(
        `Upload failed: ${uploadResponse.status} - ${uploadResponse.body}`,
      );
    }

    const data = JSON.parse(uploadResponse.body);
    console.log("Upload response data:", JSON.stringify(data));

    if (!data.upload_url) {
      throw new Error("No upload_url in response");
    }

    return data.upload_url;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

/**
 * Request transcription from AssemblyAI
 */
async function requestTranscription(audioUrl: string): Promise<string> {
  console.log("Requesting transcription for URL:", audioUrl);

  const requestBody = {
    audio_url: audioUrl,
    speech_models: ["universal-2"], // Required: specify the speech model
  };
  console.log("Transcription request body:", JSON.stringify(requestBody));

  const response = await fetch(`${ASSEMBLYAI_BASE_URL}/transcript`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(requestBody),
  });

  console.log("Transcription request response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Transcription request error:", errorText);
    throw new Error(
      `Transcription request failed: ${response.status} - ${errorText}`,
    );
  }

  const data = await response.json();
  console.log("Transcription request response:", JSON.stringify(data));

  if (!data.id) {
    throw new Error("No transcript ID in response");
  }

  return data.id;
}

/**
 * Poll for transcription completion
 */
async function pollForCompletion(transcriptId: string): Promise<any> {
  const maxAttempts = 60; // Max 5 minutes (60 * 5 seconds)
  let attempts = 0;

  console.log("Polling for transcription completion, ID:", transcriptId);

  while (attempts < maxAttempts) {
    const response = await fetch(
      `${ASSEMBLYAI_BASE_URL}/transcript/${transcriptId}`,
      {
        method: "GET",
        headers: getHeaders(),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Polling error:", errorText);
      throw new Error(`Polling failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Poll attempt", attempts + 1, "- Status:", data.status);

    if (data.status === "completed") {
      console.log("Transcription completed!");
      return data;
    }

    if (data.status === "error") {
      console.error("Transcription error:", data.error);
      throw new Error(data.error || "Transcription failed");
    }

    // Wait 5 seconds before polling again
    await new Promise((resolve) => setTimeout(resolve, 5000));
    attempts++;
  }

  throw new Error("Transcription timed out");
}
