import { TranscriptionResult } from "../services/assemblyai/types";
import { SpeechAnalysisResult } from "./analysis";
import { SpeechFeedback } from "../services/openai/analyze";

// Practice mode types
export type PracticeMode = "free" | "structured" | "challenge";

export type TemplateId =
  | "tech-pitch"
  | "investor-pitch"
  | "academic"
  | "sales-demo"
  | "conference-talk"
  | "ted-style"
  | "job-interview"
  | "thesis-defense"
  | "team-meeting"
  | "custom";

export type ChallengeType =
  | "filler-elimination"
  | "pace-consistency"
  | "articulation";

export interface RecordingSession {
  id: string;
  createdAt: string;
  audioUri: string;
  duration: number; // in milliseconds
  transcription: TranscriptionResult | null;
  analysis: SpeechAnalysisResult | null;
  aiFeedback: SpeechFeedback | null;
  practiceMode?: PracticeMode;
  templateId?: TemplateId;
  challengeType?: ChallengeType;
  targetDuration?: number; // in seconds
  challengeScore?: number; // 0-100
  title?: string;
}
