import { Ionicons } from "@expo/vector-icons";
import { ChallengeType } from "../types/recording";

export interface ChallengeDefinition {
  id: ChallengeType;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  scoringMetric: "fillerRatio" | "paceVariance" | "clarity";
  targetValue: number;
  tips: string[];
  difficultyLevels: {
    easy: { target: number; duration: number };
    medium: { target: number; duration: number };
    hard: { target: number; duration: number };
  };
}

export const CHALLENGES: ChallengeDefinition[] = [
  {
    id: "filler-elimination",
    name: "Filler Word Challenge",
    description: "Speak without using um, uh, like, you know",
    icon: "close-circle-outline",
    color: "#e29578",
    scoringMetric: "fillerRatio",
    targetValue: 0.02, // <2% filler words for max score
    tips: [
      "Pause silently instead of using fillers",
      "Take a breath before answering",
      "Slow down your speaking pace",
      "Practice with simple topics first",
    ],
    difficultyLevels: {
      easy: { target: 0.05, duration: 60 }, // <5% in 1 min
      medium: { target: 0.03, duration: 180 }, // <3% in 3 min
      hard: { target: 0.02, duration: 300 }, // <2% in 5 min
    },
  },
  {
    id: "pace-consistency",
    name: "Pace Mastery",
    description: "Maintain a consistent speaking pace throughout",
    icon: "speedometer-outline",
    color: "#83c5be",
    scoringMetric: "paceVariance",
    targetValue: 10, // <10 WPM variance for max score
    tips: [
      "Practice with a metronome app",
      "Be aware of speeding up when nervous",
      "Use pauses strategically, not randomly",
      "Record yourself and listen back",
    ],
    difficultyLevels: {
      easy: { target: 20, duration: 60 }, // <20 WPM variance in 1 min
      medium: { target: 15, duration: 180 }, // <15 WPM variance in 3 min
      hard: { target: 10, duration: 300 }, // <10 WPM variance in 5 min
    },
  },
  {
    id: "articulation",
    name: "Clear Articulation",
    description: "Speak clearly with proper enunciation",
    icon: "mic-outline",
    color: "#006d77",
    scoringMetric: "clarity",
    targetValue: 8, // 8/10 clarity score for max
    tips: [
      "Open your mouth wider when speaking",
      "Practice tongue twisters",
      "Don't rush through words",
      "Emphasize consonants, especially at word endings",
    ],
    difficultyLevels: {
      easy: { target: 6, duration: 60 }, // 6/10 clarity in 1 min
      medium: { target: 7, duration: 180 }, // 7/10 clarity in 3 min
      hard: { target: 8, duration: 300 }, // 8/10 clarity in 5 min
    },
  },
];

export function getChallengeById(
  id: ChallengeType,
): ChallengeDefinition | undefined {
  return CHALLENGES.find((c) => c.id === id);
}

/**
 * Calculate challenge score based on performance
 * @returns Score from 0-100
 */
export function calculateChallengeScore(
  challengeType: ChallengeType,
  actualValue: number,
  difficulty: "easy" | "medium" | "hard" = "medium",
): number {
  const challenge = getChallengeById(challengeType);
  if (!challenge) return 0;

  const target = challenge.difficultyLevels[difficulty].target;

  switch (challenge.scoringMetric) {
    case "fillerRatio":
      // Lower is better - 0% = 100 points, target% = 70 points, 2x target = 0 points
      if (actualValue === 0) return 100;
      if (actualValue <= target)
        return Math.round(70 + (30 * (target - actualValue)) / target);
      if (actualValue <= target * 2)
        return Math.round(70 * (1 - (actualValue - target) / target));
      return 0;

    case "paceVariance":
      // Lower variance is better
      if (actualValue <= target / 2) return 100;
      if (actualValue <= target)
        return Math.round(70 + (30 * (target - actualValue)) / target);
      if (actualValue <= target * 2)
        return Math.round(70 * (1 - (actualValue - target) / target));
      return 0;

    case "clarity":
      // Higher is better - out of 10
      return Math.round((actualValue / 10) * 100);

    default:
      return 0;
  }
}

export type ChallengeDifficulty = "easy" | "medium" | "hard";

export const DIFFICULTY_LABELS: Record<ChallengeDifficulty, string> = {
  easy: "Beginner",
  medium: "Intermediate",
  hard: "Advanced",
};
