import { getTotalFillerCount } from "./fillerWords";
import { getPauseStats, getPausesPerMinute } from "./pauseDetection";
import {
  FillerWordResult,
  PauseResult,
  SpeakingRateResult,
  ScoreBreakdown,
} from "../types/analysis";
import { SCORING_CONFIG, SPEAKING_RATE_CONFIG } from "../constants/thresholds";

/**
 * Calculate the overall score based on all analysis metrics
 * Returns a breakdown of individual scores and combined rating
 */
export function calculateOverallScore(
  fillerResults: FillerWordResult[],
  pauses: PauseResult[],
  speakingRate: SpeakingRateResult
): ScoreBreakdown {
  const feedback: string[] = [];

  // 1. Calculate Filler Word Score (0-100)
  const totalFillers = getTotalFillerCount(fillerResults);
  const fillerRatio = totalFillers / Math.max(speakingRate.totalWords, 1);
  let fillerScoreRaw = 100;

  if (fillerRatio > SCORING_CONFIG.FILLER_POOR) {
    fillerScoreRaw = 20;
    feedback.push("Try to reduce filler words significantly - they make up over 15% of your speech");
  } else if (fillerRatio > SCORING_CONFIG.FILLER_FAIR) {
    fillerScoreRaw = 40;
    feedback.push("Work on reducing filler words - they make up about 10-15% of your speech");
  } else if (fillerRatio > SCORING_CONFIG.FILLER_GOOD) {
    fillerScoreRaw = 60;
    feedback.push("Good control of filler words, but there's room for improvement");
  } else if (fillerRatio > SCORING_CONFIG.FILLER_EXCELLENT) {
    fillerScoreRaw = 80;
    feedback.push("Excellent control of filler words!");
  } else {
    fillerScoreRaw = 100;
    feedback.push("Outstanding - minimal filler words detected!");
  }

  // 2. Calculate Pause Score (0-100)
  const pauseStats = getPauseStats(pauses);
  const pausesPerMinute = getPausesPerMinute(
    pauseStats.count,
    speakingRate.speakingDuration
  );
  let pauseScoreRaw = 100;

  if (pausesPerMinute > SCORING_CONFIG.PAUSE_FAIR) {
    pauseScoreRaw = 20;
    feedback.push("Too many long pauses detected - try to maintain better flow");
  } else if (pausesPerMinute > SCORING_CONFIG.PAUSE_GOOD) {
    pauseScoreRaw = 50;
    feedback.push("Some long pauses detected - work on continuity");
  } else if (pausesPerMinute > SCORING_CONFIG.PAUSE_EXCELLENT) {
    pauseScoreRaw = 75;
    feedback.push("Good pacing with natural pauses");
  } else {
    pauseScoreRaw = 100;
    feedback.push("Excellent flow and natural pacing!");
  }

  // 3. Calculate Speaking Rate Score (0-100)
  const wpm = speakingRate.wordsPerMinute;
  let paceScoreRaw = 100;

  if (wpm < SPEAKING_RATE_CONFIG.VERY_SLOW_THRESHOLD) {
    paceScoreRaw = 25;
    feedback.push("Speaking pace is very slow - try to speak more naturally");
  } else if (wpm < SPEAKING_RATE_CONFIG.SLOW_THRESHOLD) {
    paceScoreRaw = 50;
    feedback.push("Speaking pace is slow - try to increase slightly");
  } else if (wpm < SPEAKING_RATE_CONFIG.IDEAL_MIN) {
    paceScoreRaw = 75;
    feedback.push("Speaking pace is slightly below ideal range");
  } else if (wpm > SPEAKING_RATE_CONFIG.VERY_FAST_THRESHOLD) {
    paceScoreRaw = 25;
    feedback.push("Speaking pace is too fast - slow down for clarity");
  } else if (wpm > SPEAKING_RATE_CONFIG.FAST_THRESHOLD) {
    paceScoreRaw = 50;
    feedback.push("Speaking pace is fast - consider slowing down");
  } else if (wpm > SPEAKING_RATE_CONFIG.IDEAL_MAX) {
    paceScoreRaw = 75;
    feedback.push("Speaking pace is slightly above ideal range");
  } else {
    paceScoreRaw = 100;
    feedback.push("Perfect speaking pace!");
  }

  // 4. Calculate weighted overall score
  const weightedScore =
    fillerScoreRaw * SCORING_CONFIG.FILLER_WEIGHT +
    pauseScoreRaw * SCORING_CONFIG.PAUSE_WEIGHT +
    paceScoreRaw * SCORING_CONFIG.PACE_WEIGHT;

  // Convert 0-100 scores to 1-5 star ratings
  const overallScore = Math.max(1, Math.min(5, Math.round(weightedScore / 20)));
  const fillerScore = Math.max(1, Math.min(5, Math.round(fillerScoreRaw / 20)));
  const pauseScore = Math.max(1, Math.min(5, Math.round(pauseScoreRaw / 20)));
  const paceScore = Math.max(1, Math.min(5, Math.round(paceScoreRaw / 20)));

  return {
    overallScore,
    fillerScore,
    pauseScore,
    paceScore,
    feedback,
  };
}

/**
 * Get a text description for a star rating
 */
export function getRatingDescription(stars: number): string {
  switch (stars) {
    case 5:
      return "Excellent";
    case 4:
      return "Good";
    case 3:
      return "Average";
    case 2:
      return "Needs Improvement";
    case 1:
      return "Poor";
    default:
      return "N/A";
  }
}
