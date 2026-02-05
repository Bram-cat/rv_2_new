import { useState, useCallback } from "react";
import { transcribeAudio } from "../services/assemblyai/transcribe";
import { isAssemblyAIConfigured } from "../services/assemblyai/client";
import { TranscriptionResult } from "../services/assemblyai/types";

interface TranscriptionState {
  result: TranscriptionResult | null;
  isLoading: boolean;
  error: string | null;
  progress: "idle" | "uploading" | "processing" | "complete" | "error";
}

export function useTranscription() {
  const [state, setState] = useState<TranscriptionState>({
    result: null,
    isLoading: false,
    error: null,
    progress: "idle",
  });

  const transcribe = useCallback(
    async (audioUri: string): Promise<TranscriptionResult | null> => {
      // Check if AssemblyAI is configured
      if (!isAssemblyAIConfigured()) {
        setState({
          result: null,
          isLoading: false,
          error:
            "AssemblyAI API key is not configured. Please add EXPO_PUBLIC_ASSEMBLYAI_API_KEY to your .env file.",
          progress: "error",
        });
        return null;
      }

      setState({
        result: null,
        isLoading: true,
        error: null,
        progress: "uploading",
      });

      try {
        // Update progress to processing
        setState((prev) => ({ ...prev, progress: "processing" }));

        const result = await transcribeAudio(audioUri);

        setState({
          result,
          isLoading: false,
          error: null,
          progress: "complete",
        });

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Transcription failed";

        setState({
          result: null,
          isLoading: false,
          error: errorMessage,
          progress: "error",
        });

        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      result: null,
      isLoading: false,
      error: null,
      progress: "idle",
    });
  }, []);

  return {
    result: state.result,
    isLoading: state.isLoading,
    error: state.error,
    progress: state.progress,
    isConfigured: isAssemblyAIConfigured(),
    transcribe,
    reset,
  };
}
