export interface WordTimestamp {
  text: string;
  start: number; // milliseconds
  end: number; // milliseconds
  confidence: number;
}

export interface TranscriptionResult {
  text: string;
  words: WordTimestamp[];
  audioDuration: number; // seconds
  confidence: number;
}

export interface TranscriptionError {
  message: string;
  code?: string;
}
