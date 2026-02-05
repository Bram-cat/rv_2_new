import { WordTimestamp } from "../services/assemblyai/types";
import { FillerWordResult } from "../types/analysis";
import { STRICT_FILLER_WORDS } from "../constants/fillerWords";

/**
 * Detect filler words in the transcribed speech
 * Uses word-level timestamps to identify and track filler word occurrences
 */
export function detectFillerWords(words: WordTimestamp[]): FillerWordResult[] {
  const fillerMap = new Map<string, FillerWordResult>();

  words.forEach((word) => {
    // Normalize the word: lowercase and remove punctuation
    const normalizedWord = word.text.toLowerCase().replace(/[.,!?;:'"]/g, "");

    // Check if it's a filler word
    if (STRICT_FILLER_WORDS.includes(normalizedWord)) {
      const existing = fillerMap.get(normalizedWord);
      if (existing) {
        existing.count++;
        existing.instances.push({ start: word.start, end: word.end });
      } else {
        fillerMap.set(normalizedWord, {
          word: normalizedWord,
          count: 1,
          instances: [{ start: word.start, end: word.end }],
        });
      }
    }
  });

  // Sort by count (most frequent first)
  return Array.from(fillerMap.values()).sort((a, b) => b.count - a.count);
}

/**
 * Get the total count of all filler words
 */
export function getTotalFillerCount(fillerResults: FillerWordResult[]): number {
  return fillerResults.reduce((sum, result) => sum + result.count, 0);
}

/**
 * Calculate the filler word ratio (fillers / total words)
 */
export function getFillerRatio(
  fillerResults: FillerWordResult[],
  totalWords: number
): number {
  if (totalWords === 0) return 0;
  return getTotalFillerCount(fillerResults) / totalWords;
}

/**
 * Get a summary of the most common filler words
 */
export function getFillerSummary(
  fillerResults: FillerWordResult[],
  limit: number = 3
): string {
  if (fillerResults.length === 0) {
    return "No filler words detected";
  }

  const topFillers = fillerResults.slice(0, limit);
  const summary = topFillers
    .map((f) => `"${f.word}" (${f.count}x)`)
    .join(", ");

  return summary;
}
