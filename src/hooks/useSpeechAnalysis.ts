import { useMemo } from "react";
import { TranscriptionResult } from "../services/assemblyai/types";
import { SpeechAnalysisResult } from "../types/analysis";
import { detectFillerWords } from "../analysis/fillerWords";
import { detectPauses, getPauseStats } from "../analysis/pauseDetection";
import { calculateSpeakingRate } from "../analysis/speakingRate";
import { calculateOverallScore } from "../analysis/scoring";

/**
 * Hook that performs speech analysis on transcription results
 * Analyzes filler words, pauses, speaking rate, and calculates overall score
 */
export function useSpeechAnalysis(
  transcription: TranscriptionResult | null
): SpeechAnalysisResult | null {
  return useMemo(() => {
    // Return null if no transcription or empty
    if (!transcription || transcription.words.length === 0) {
      return null;
    }

    // Run all analysis algorithms
    const fillerWords = detectFillerWords(transcription.words);
    const pauses = detectPauses(transcription.words);
    const speakingRate = calculateSpeakingRate(
      transcription.words,
      transcription.audioDuration
    );
    const pauseStats = getPauseStats(pauses);
    const score = calculateOverallScore(fillerWords, pauses, speakingRate);

    return {
      fillerWords,
      pauses,
      speakingRate,
      score,
      pauseStats,
    };
  }, [transcription]);
}

/**
 * Standalone function to analyze a transcription result
 * Useful for analyzing outside of React components
 */
export function analyzeSpeech(
  transcription: TranscriptionResult
): SpeechAnalysisResult | null {
  if (transcription.words.length === 0) {
    return null;
  }

  const fillerWords = detectFillerWords(transcription.words);
  const pauses = detectPauses(transcription.words);
  const speakingRate = calculateSpeakingRate(
    transcription.words,
    transcription.audioDuration
  );
  const pauseStats = getPauseStats(pauses);
  const score = calculateOverallScore(fillerWords, pauses, speakingRate);

  return {
    fillerWords,
    pauses,
    speakingRate,
    score,
    pauseStats,
  };
}
