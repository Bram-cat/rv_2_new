import { WordTimestamp } from "../services/assemblyai/types";
import { SpeakingRateResult } from "../types/analysis";
import { STRICT_FILLER_WORDS } from "../constants/fillerWords";
import { SPEAKING_RATE_CONFIG } from "../constants/thresholds";

/**
 * Calculate speaking rate metrics from word timestamps
 */
export function calculateSpeakingRate(
  words: WordTimestamp[],
  audioDuration: number // in seconds
): SpeakingRateResult {
  const totalWords = words.length;

  if (totalWords === 0) {
    return {
      wordsPerMinute: 0,
      totalWords: 0,
      contentWords: 0,
      speakingDuration: 0,
    };
  }

  // Count content words (excluding filler words)
  const contentWords = words.filter((word) => {
    const normalized = word.text.toLowerCase().replace(/[.,!?;:'"]/g, "");
    return !STRICT_FILLER_WORDS.includes(normalized);
  }).length;

  // Calculate actual speaking time (from first to last word)
  const firstWord = words[0];
  const lastWord = words[words.length - 1];
  const speakingDuration = (lastWord.end - firstWord.start) / 1000; // convert to seconds

  // WPM based on actual speaking time (not including pre/post silence)
  const wordsPerMinute =
    speakingDuration > 0
      ? Math.round((totalWords / speakingDuration) * 60)
      : 0;

  return {
    wordsPerMinute,
    totalWords,
    contentWords,
    speakingDuration,
  };
}

/**
 * Evaluate speaking rate and return a description
 */
export function evaluateSpeakingRate(wpm: number): {
  rating: "too_slow" | "slow" | "ideal" | "fast" | "too_fast";
  description: string;
} {
  if (wpm < SPEAKING_RATE_CONFIG.VERY_SLOW_THRESHOLD) {
    return {
      rating: "too_slow",
      description: "Speaking pace is very slow - try to increase speed",
    };
  }

  if (wpm < SPEAKING_RATE_CONFIG.SLOW_THRESHOLD) {
    return {
      rating: "slow",
      description: "Speaking pace is slightly slow",
    };
  }

  if (wpm <= SPEAKING_RATE_CONFIG.IDEAL_MAX) {
    return {
      rating: "ideal",
      description: "Perfect speaking pace!",
    };
  }

  if (wpm <= SPEAKING_RATE_CONFIG.FAST_THRESHOLD) {
    return {
      rating: "fast",
      description: "Speaking pace is slightly fast",
    };
  }

  return {
    rating: "too_fast",
    description: "Speaking pace is too fast - try to slow down",
  };
}

/**
 * Get the ideal range description
 */
export function getIdealRangeDescription(): string {
  return `${SPEAKING_RATE_CONFIG.IDEAL_MIN}-${SPEAKING_RATE_CONFIG.IDEAL_MAX} WPM`;
}
