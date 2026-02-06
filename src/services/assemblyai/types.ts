export interface WordTimestamp {
  text: string;
  start: number; // milliseconds
  end: number; // milliseconds
  confidence: number;
}

export interface SentimentResult {
  text: string;
  start: number;
  end: number;
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  confidence: number;
}

export interface TranscriptionResult {
  text: string;
  words: WordTimestamp[];
  audioDuration: number; // seconds
  confidence: number;
  sentimentAnalysis?: SentimentResult[];
}

export interface TranscriptionError {
  message: string;
  code?: string;
}
