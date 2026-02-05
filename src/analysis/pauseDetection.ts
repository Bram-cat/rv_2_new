import { WordTimestamp } from "../services/assemblyai/types";
import { PauseResult } from "../types/analysis";
import { PAUSE_CONFIG } from "../constants/thresholds";

/**
 * Detect pauses in speech by analyzing gaps between consecutive words
 * A pause is defined as a gap longer than PAUSE_CONFIG.MIN_PAUSE_MS (1 second)
 */
export function detectPauses(words: WordTimestamp[]): PauseResult[] {
  const pauses: PauseResult[] = [];

  if (words.length < 2) {
    return pauses;
  }

  for (let i = 1; i < words.length; i++) {
    const previousWord = words[i - 1];
    const currentWord = words[i];

    // Calculate the gap between the end of the previous word and start of current
    const gap = currentWord.start - previousWord.end;

    // If gap is longer than threshold, it's a significant pause
    if (gap >= PAUSE_CONFIG.MIN_PAUSE_MS) {
      pauses.push({
        start: previousWord.end,
        end: currentWord.start,
        duration: gap,
      });
    }
  }

  return pauses;
}

/**
 * Get statistics about the detected pauses
 */
export function getPauseStats(pauses: PauseResult[]): {
  count: number;
  totalDuration: number;
  averageDuration: number;
  longestPause: number;
} {
  if (pauses.length === 0) {
    return {
      count: 0,
      totalDuration: 0,
      averageDuration: 0,
      longestPause: 0,
    };
  }

  const totalDuration = pauses.reduce((sum, p) => sum + p.duration, 0);
  const longestPause = Math.max(...pauses.map((p) => p.duration));

  return {
    count: pauses.length,
    totalDuration,
    averageDuration: totalDuration / pauses.length,
    longestPause,
  };
}

/**
 * Calculate pauses per minute based on speaking duration
 */
export function getPausesPerMinute(
  pauseCount: number,
  speakingDurationSeconds: number
): number {
  if (speakingDurationSeconds === 0) return 0;
  return (pauseCount / speakingDurationSeconds) * 60;
}

/**
 * Categorize pauses as normal or long
 */
export function categorizePauses(pauses: PauseResult[]): {
  normalPauses: PauseResult[];
  longPauses: PauseResult[];
} {
  return {
    normalPauses: pauses.filter((p) => p.duration < PAUSE_CONFIG.LONG_PAUSE_MS),
    longPauses: pauses.filter((p) => p.duration >= PAUSE_CONFIG.LONG_PAUSE_MS),
  };
}
