export interface FillerWordResult {
  word: string;
  count: number;
  instances: { start: number; end: number }[];
}

export interface PauseResult {
  start: number;
  end: number;
  duration: number; // in milliseconds
}

export interface SpeakingRateResult {
  wordsPerMinute: number;
  totalWords: number;
  contentWords: number; // excluding filler words
  speakingDuration: number; // in seconds
}

export interface ScoreBreakdown {
  overallScore: number; // 1-5 stars
  fillerScore: number; // 1-5
  pauseScore: number; // 1-5
  paceScore: number; // 1-5
  feedback: string[];
}

export interface SpeechAnalysisResult {
  fillerWords: FillerWordResult[];
  pauses: PauseResult[];
  speakingRate: SpeakingRateResult;
  score: ScoreBreakdown;
  pauseStats: {
    count: number;
    totalDuration: number;
    averageDuration: number;
  };
}
