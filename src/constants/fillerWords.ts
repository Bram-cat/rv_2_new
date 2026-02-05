// Common filler words to detect in speech
// These are words that typically indicate hesitation or are used as verbal placeholders
export const FILLER_WORDS = [
  // Common hesitation sounds
  "um",
  "uh",
  "er",
  "ah",
  "hmm",

  // Common verbal fillers
  "like",
  "basically",
  "actually",
  "literally",
  "right",
  "so",
  "well",
  "okay",
  "yeah",

  // Phrase fillers (detected as individual words)
  "you",  // part of "you know"
  "know", // part of "you know"
  "i",    // part of "i mean"
  "mean", // part of "i mean"
  "kind", // part of "kind of"
  "of",   // part of "kind of", "sort of"
  "sort", // part of "sort of"
];

// Multi-word filler phrases - checked separately
export const FILLER_PHRASES = [
  "you know",
  "i mean",
  "kind of",
  "sort of",
];

// Strict filler words (always count as fillers regardless of context)
export const STRICT_FILLER_WORDS = [
  "um",
  "uh",
  "er",
  "ah",
  "hmm",
  "basically",
  "actually",
  "literally",
];
