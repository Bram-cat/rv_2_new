import AsyncStorage from "@react-native-async-storage/async-storage";
import { RecordingSession } from "../../types/recording";
import { SpeechFeedback } from "./analyze";
import { COACHING_KNOWLEDGE_BASE } from "./trainingData";

const TRAINING_DATA_KEY = "@speechi_training_data";
const USER_PROFILE_KEY = "@speechi_user_profile";

/**
 * Stored coaching knowledge from YouTube transcripts or other sources.
 * This gets injected into the AI system prompt so it knows
 * how professional coaches evaluate speeches.
 */
export interface CoachingKnowledge {
  content: string;
  source?: string;
  addedAt: string;
}

/**
 * User's progress profile built from past sessions.
 */
export interface UserProfile {
  totalSessions: number;
  averageScore: number;
  bestScore: number;
  worstScore: number;
  recurringStrengths: string[];
  recurringWeaknesses: string[];
  averagePace: number;
  averageFillerCount: number;
  scoreHistory: { date: string; score: number }[];
  topFillerWords: { word: string; count: number }[];
  lowAreas: { area: string; avgScore: number }[];
  lastUpdated: string;
}

/**
 * Save coaching knowledge (YouTube transcripts, etc.) to local storage.
 * This is additive - new content gets appended.
 */
export async function addCoachingKnowledge(
  content: string,
  source?: string,
): Promise<void> {
  const existing = await getCoachingKnowledge();
  const entry: CoachingKnowledge = {
    content,
    source,
    addedAt: new Date().toISOString(),
  };
  existing.push(entry);
  await AsyncStorage.setItem(TRAINING_DATA_KEY, JSON.stringify(existing));
}

/**
 * Get all stored coaching knowledge.
 */
export async function getCoachingKnowledge(): Promise<CoachingKnowledge[]> {
  try {
    const data = await AsyncStorage.getItem(TRAINING_DATA_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Clear all coaching knowledge.
 */
export async function clearCoachingKnowledge(): Promise<void> {
  await AsyncStorage.removeItem(TRAINING_DATA_KEY);
}

/**
 * Build a user progress profile from their past sessions.
 * This creates a summary the AI can reference to give personalized feedback.
 */
export function buildUserProfile(sessions: RecordingSession[]): UserProfile {
  const analyzedSessions = sessions.filter(
    (s) => s.aiFeedback || s.analysis?.score,
  );

  if (analyzedSessions.length === 0) {
    return {
      totalSessions: 0,
      averageScore: 0,
      bestScore: 0,
      worstScore: 0,
      recurringStrengths: [],
      recurringWeaknesses: [],
      averagePace: 0,
      averageFillerCount: 0,
      scoreHistory: [],
      topFillerWords: [],
      lowAreas: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  // Collect scores
  const scores = analyzedSessions
    .map((s) => {
      const ai = s.aiFeedback?.overallScore || 0;
      const local = (s.analysis?.score?.overallScore || 0) * 2;
      return ai || local;
    })
    .filter((s) => s > 0);

  // Collect strengths and weaknesses frequency
  const strengthCounts = new Map<string, number>();
  const weaknessCounts = new Map<string, number>();

  analyzedSessions.forEach((s) => {
    if (s.aiFeedback) {
      s.aiFeedback.strengths?.forEach((str) => {
        strengthCounts.set(str, (strengthCounts.get(str) || 0) + 1);
      });
      s.aiFeedback.improvements?.forEach((imp) => {
        weaknessCounts.set(imp, (weaknessCounts.get(imp) || 0) + 1);
      });
    }
  });

  // Get top recurring items (mentioned 2+ times)
  const recurringStrengths = [...strengthCounts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([str]) => str);

  const recurringWeaknesses = [...weaknessCounts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([str]) => str);

  // Pace and filler stats
  const paces = analyzedSessions
    .map((s) => s.analysis?.speakingRate?.wordsPerMinute || 0)
    .filter((p) => p > 0);
  const fillerCounts = analyzedSessions.map(
    (s) => s.aiFeedback?.fillerWordCount || 0,
  );

  // Aggregate filler words across all sessions
  const fillerWordAgg = new Map<string, number>();
  analyzedSessions.forEach((s) => {
    if (s.aiFeedback?.fillerWords) {
      s.aiFeedback.fillerWords.forEach((fw) => {
        // Handle formats like "um (3)" or just "um"
        const match = fw.match(/^(\w+)\s*\((\d+)\)$/);
        if (match) {
          const word = match[1].toLowerCase();
          fillerWordAgg.set(word, (fillerWordAgg.get(word) || 0) + parseInt(match[2]));
        } else {
          const word = fw.toLowerCase().replace(/[^a-z]/g, "");
          if (word) fillerWordAgg.set(word, (fillerWordAgg.get(word) || 0) + 1);
        }
      });
    }
  });
  const topFillerWords = [...fillerWordAgg.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word, count]) => ({ word, count }));

  // Track consistently low scoring areas
  const clarityScores: number[] = [];
  const paceScores: number[] = [];
  const confidenceScores: number[] = [];
  analyzedSessions.forEach((s) => {
    if (s.aiFeedback) {
      if (s.aiFeedback.clarity) clarityScores.push(s.aiFeedback.clarity);
      if (s.aiFeedback.pace) paceScores.push(s.aiFeedback.pace);
      if (s.aiFeedback.confidence) confidenceScores.push(s.aiFeedback.confidence);
    }
  });
  const avg = (arr: number[]) => arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;
  const lowAreas: { area: string; avgScore: number }[] = [];
  if (clarityScores.length >= 2 && avg(clarityScores) < 7) lowAreas.push({ area: "Clarity", avgScore: avg(clarityScores) });
  if (paceScores.length >= 2 && avg(paceScores) < 7) lowAreas.push({ area: "Pace", avgScore: avg(paceScores) });
  if (confidenceScores.length >= 2 && avg(confidenceScores) < 7) lowAreas.push({ area: "Confidence", avgScore: avg(confidenceScores) });

  // Score history (last 10)
  const scoreHistory = analyzedSessions
    .filter((s) => {
      const ai = s.aiFeedback?.overallScore || 0;
      const local = (s.analysis?.score?.overallScore || 0) * 2;
      return (ai || local) > 0;
    })
    .slice(0, 10)
    .map((s) => ({
      date: s.createdAt,
      score:
        s.aiFeedback?.overallScore ||
        (s.analysis?.score?.overallScore || 0) * 2,
    }));

  return {
    totalSessions: sessions.length,
    averageScore:
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) /
          10
        : 0,
    bestScore: scores.length > 0 ? Math.max(...scores) : 0,
    worstScore: scores.length > 0 ? Math.min(...scores) : 0,
    recurringStrengths,
    recurringWeaknesses,
    averagePace:
      paces.length > 0
        ? Math.round(paces.reduce((a, b) => a + b, 0) / paces.length)
        : 0,
    averageFillerCount:
      fillerCounts.length > 0
        ? Math.round(
            fillerCounts.reduce((a, b) => a + b, 0) / fillerCounts.length,
          )
        : 0,
    scoreHistory,
    topFillerWords,
    lowAreas,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Build the system prompt context string from user profile and coaching knowledge.
 * This gets prepended to the AI system message.
 */
export function buildAIContext(
  userProfile: UserProfile,
  coachingKnowledge: CoachingKnowledge[],
): string {
  let context = "";

  // Add user history context
  if (userProfile.totalSessions > 0) {
    context += `\n--- USER PROGRESS CONTEXT ---
Sessions: ${userProfile.totalSessions}`;

    if (userProfile.averageScore > 0) {
      context += ` | Avg: ${userProfile.averageScore}/10 (best: ${userProfile.bestScore}, worst: ${userProfile.worstScore})`;
    }

    if (userProfile.averagePace > 0) {
      context += ` | Pace: ${userProfile.averagePace} WPM`;
    }

    if (userProfile.averageFillerCount > 0) {
      context += ` | Fillers/session: ${userProfile.averageFillerCount}`;
    }

    if (userProfile.recurringStrengths.length > 0) {
      context += `\nStrengths: ${userProfile.recurringStrengths.join("; ")}`;
    }

    if (userProfile.recurringWeaknesses.length > 0) {
      context += `\nWeaknesses: ${userProfile.recurringWeaknesses.join("; ")}`;
    }

    if (userProfile.scoreHistory.length >= 2) {
      const first =
        userProfile.scoreHistory[userProfile.scoreHistory.length - 1];
      const latest = userProfile.scoreHistory[0];
      if (first && latest) {
        const trend = latest.score - first.score;
        context += `\nTrend: ${trend > 0 ? "improving" : trend < 0 ? "declining" : "stable"} (${first.score} → ${latest.score} over ${userProfile.scoreHistory.length} sessions)`;
      }
    }

    // Include recent score details for richer context
    if (userProfile.scoreHistory.length > 0) {
      const recent = userProfile.scoreHistory.slice(0, 5);
      context += `\nRecent scores: ${recent.map((h) => `${new Date(h.date).toLocaleDateString()}: ${h.score}/10`).join(", ")}`;
    }

    // Recurring patterns the AI MUST call out
    const patterns: string[] = [];
    if (userProfile.topFillerWords.length > 0) {
      const fillerStr = userProfile.topFillerWords.map((f) => `"${f.word}" (${f.count}x total)`).join(", ");
      patterns.push(`REPEAT OFFENDER FILLERS: ${fillerStr}. These keep showing up. Call them out by name.`);
    }
    if (userProfile.lowAreas.length > 0) {
      const lowStr = userProfile.lowAreas.map((a) => `${a.area} (avg ${a.avgScore}/10)`).join(", ");
      patterns.push(`CONSISTENTLY LOW AREAS: ${lowStr}. These haven't improved much. Push harder on these.`);
    }
    if (userProfile.recurringWeaknesses.length > 0) {
      patterns.push(`RECURRING FEEDBACK: ${userProfile.recurringWeaknesses.join("; ")}. User has heard this before — remind them it's still an issue.`);
    }

    if (patterns.length > 0) {
      context += `\n\n⚠️ RECURRING MISTAKES (MUST ADDRESS):
${patterns.join("\n")}
Be direct about these. Say things like "I've noticed this across multiple sessions" or "This keeps coming up — let's fix it for real this time." Don't sugarcoat repeated issues.`;
    }

    context += `\nIMPORTANT: Reference the user's history naturally. If they're improving, celebrate it with humor ("You went from a 5 to a 7 — that's basically a glow-up!"). If they keep making the same mistake, call it out playfully ("We meet again, filler words. Your old nemesis."). Make the user feel like you KNOW them and their journey.
--- END USER CONTEXT ---\n`;
  }

  // Add hardcoded coaching knowledge base (from YouTube video summaries)
  if (COACHING_KNOWLEDGE_BASE && COACHING_KNOWLEDGE_BASE.trim().length > 0 && !COACHING_KNOWLEDGE_BASE.includes("PASTE YOUR COACHING CONTENT HERE")) {
    context += `\n--- SPEECH COACHING KNOWLEDGE BASE (YOUR SCORING RUBRIC) ---
USE THIS AS YOUR PRIMARY SCORING FRAMEWORK. Score each speech against these criteria:
- HAIL Framework (honesty, authenticity, integrity, love) for content quality
- Vocal Toolbox (register, timbre, prosody, pace, silence, pitch, volume) for delivery
- Winston's Heuristics (empowerment promise, cycling, fencing, verbal punctuation) for structure
- Spontaneous Speaking frameworks (problem-solution-benefit, what-so what-now what) for organization

When suggesting vocabulary words, PREFER terms from the "Vocabulary from Communication Science" list below. These are real terms from expert speech coaches that will genuinely level up the user's speaking knowledge.

${COACHING_KNOWLEDGE_BASE}
--- END COACHING KNOWLEDGE ---\n`;
  }

  // Add any additional coaching knowledge from AsyncStorage
  if (coachingKnowledge.length > 0) {
    const combinedKnowledge = coachingKnowledge
      .map((k) => k.content)
      .join("\n\n");
    // Increased limit to support ~5000 words of coaching content
    const truncated =
      combinedKnowledge.length > 25000
        ? combinedKnowledge.substring(0, 25000) + "..."
        : combinedKnowledge;

    context += `\n--- ADDITIONAL COACHING KNOWLEDGE ---
${truncated}
--- END ADDITIONAL KNOWLEDGE ---\n`;
  }

  return context;
}
