// Recording constraints
export const RECORDING_CONFIG = {
  MAX_DURATION_MS: 5 * 60 * 1000, // 5 minutes
  MIN_DURATION_MS: 5 * 1000, // 5 seconds minimum for meaningful analysis
  WARNING_THRESHOLD_MS: 30 * 1000, // Show warning at 30 seconds remaining
};

// Pause detection thresholds
export const PAUSE_CONFIG = {
  MIN_PAUSE_MS: 1000, // 1 second minimum to count as a pause
  LONG_PAUSE_MS: 3000, // 3 seconds is considered a long pause
};

// Speaking rate thresholds (words per minute)
export const SPEAKING_RATE_CONFIG = {
  IDEAL_MIN: 120,
  IDEAL_MAX: 160,
  SLOW_THRESHOLD: 100,
  FAST_THRESHOLD: 180,
  VERY_SLOW_THRESHOLD: 80,
  VERY_FAST_THRESHOLD: 200,
};

// Scoring thresholds
export const SCORING_CONFIG = {
  // Filler word ratio thresholds (fillers / total words)
  FILLER_EXCELLENT: 0.02, // < 2%
  FILLER_GOOD: 0.05, // < 5%
  FILLER_FAIR: 0.10, // < 10%
  FILLER_POOR: 0.15, // < 15%

  // Pauses per minute thresholds
  PAUSE_EXCELLENT: 3,
  PAUSE_GOOD: 6,
  PAUSE_FAIR: 10,

  // Score weights (must sum to 1.0)
  FILLER_WEIGHT: 0.35,
  PAUSE_WEIGHT: 0.30,
  PACE_WEIGHT: 0.35,
};
