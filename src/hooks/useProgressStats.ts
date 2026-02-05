import { useMemo } from "react";
import { RecordingSession, ChallengeType } from "../types/recording";

export interface ProgressStats {
  totalSessions: number;
  totalPracticeMinutes: number;
  sessionsThisWeek: number;
  sessionsLastWeek: number;
  weekOverWeekChange: number; // percentage
  currentStreak: number; // days in a row
  averageScore: number;
  averagePace: number; // WPM
  averageFillerRatio: number;
  scoreImprovement: number; // % improvement recent vs older
  topChallenge: { type: ChallengeType; highScore: number } | null;
  fillerWordTrend: number[]; // Last 7 sessions filler %
  paceTrend: number[]; // Last 7 sessions WPM
  scoreTrend: number[]; // Last 7 sessions overall score
  practiceByMode: {
    free: number;
    structured: number;
    challenge: number;
  };
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isWithinLastNDays(dateStr: string, days: number): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays <= days;
}

function calculateStreak(sessions: RecordingSession[]): number {
  if (sessions.length === 0) return 0;

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const practiceDays = new Set<string>();
  sortedSessions.forEach((session) => {
    const date = new Date(session.createdAt);
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    practiceDays.add(dateKey);
  });

  let streak = 0;
  const today = new Date();

  // Start checking from today or yesterday
  let checkDate = new Date(today);
  const todayKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;

  // If no practice today, check if there was practice yesterday to start the streak
  if (!practiceDays.has(todayKey)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
    if (practiceDays.has(dateKey)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
    // Safety limit
    if (streak > 365) break;
  }

  return streak;
}

export function useProgressStats(sessions: RecordingSession[]): ProgressStats {
  return useMemo(() => {
    const now = new Date();
    const startOfThisWeek = getStartOfWeek(now);
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    // Sessions this week and last week
    const sessionsThisWeek = sessions.filter(
      (s) => new Date(s.createdAt) >= startOfThisWeek,
    ).length;

    const sessionsLastWeek = sessions.filter((s) => {
      const date = new Date(s.createdAt);
      return date >= startOfLastWeek && date < startOfThisWeek;
    }).length;

    const weekOverWeekChange =
      sessionsLastWeek > 0
        ? Math.round(
            ((sessionsThisWeek - sessionsLastWeek) / sessionsLastWeek) * 100,
          )
        : sessionsThisWeek > 0
          ? 100
          : 0;

    // Total practice time
    const totalPracticeMinutes = Math.round(
      sessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60000,
    );

    // Streak calculation
    const currentStreak = calculateStreak(sessions);

    // Average scores from AI feedback
    const sessionsWithFeedback = sessions.filter((s) => s.aiFeedback);
    const averageScore =
      sessionsWithFeedback.length > 0
        ? Math.round(
            sessionsWithFeedback.reduce(
              (acc, s) => acc + (s.aiFeedback?.overallScore || 0),
              0,
            ) / sessionsWithFeedback.length,
          )
        : 0;

    // Average pace from analysis
    const sessionsWithAnalysis = sessions.filter((s) => s.analysis);
    const averagePace =
      sessionsWithAnalysis.length > 0
        ? Math.round(
            sessionsWithAnalysis.reduce(
              (acc, s) => acc + (s.analysis?.speakingRate?.wordsPerMinute || 0),
              0,
            ) / sessionsWithAnalysis.length,
          )
        : 0;

    // Average filler ratio
    const averageFillerRatio =
      sessionsWithAnalysis.length > 0
        ? sessionsWithAnalysis.reduce((acc, s) => {
            const total = s.analysis?.speakingRate?.totalWords || 1;
            const fillers =
              s.analysis?.fillerWords?.reduce(
                (sum: number, fw: any) => sum + (fw.count || 0),
                0,
              ) || 0;
            return acc + fillers / total;
          }, 0) / sessionsWithAnalysis.length
        : 0;

    // Score improvement (compare last 5 sessions to previous 5)
    const recentSessions = sessionsWithFeedback.slice(0, 5);
    const olderSessions = sessionsWithFeedback.slice(5, 10);

    const recentAvg =
      recentSessions.length > 0
        ? recentSessions.reduce(
            (acc, s) => acc + (s.aiFeedback?.overallScore || 0),
            0,
          ) / recentSessions.length
        : 0;

    const olderAvg =
      olderSessions.length > 0
        ? olderSessions.reduce(
            (acc, s) => acc + (s.aiFeedback?.overallScore || 0),
            0,
          ) / olderSessions.length
        : recentAvg;

    const scoreImprovement =
      olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : 0;

    // Top challenge score
    const challengeSessions = sessions.filter(
      (s) => s.practiceMode === "challenge" && s.challengeScore !== undefined,
    );

    let topChallenge: { type: ChallengeType; highScore: number } | null = null;
    if (challengeSessions.length > 0) {
      const byType = challengeSessions.reduce(
        (acc, s) => {
          const type = s.challengeType!;
          if (!acc[type] || (s.challengeScore || 0) > acc[type]) {
            acc[type] = s.challengeScore || 0;
          }
          return acc;
        },
        {} as Record<ChallengeType, number>,
      );

      const topEntry = Object.entries(byType).sort(([, a], [, b]) => b - a)[0];
      if (topEntry) {
        topChallenge = {
          type: topEntry[0] as ChallengeType,
          highScore: topEntry[1],
        };
      }
    }

    // Trends (last 7 sessions, ordered oldest to newest for charting)
    const last7 = sessionsWithAnalysis.slice(0, 7).reverse();

    const fillerWordTrend = last7.map((s) => {
      const total = s.analysis?.speakingRate?.totalWords || 1;
      const fillers =
        s.analysis?.fillerWords?.reduce(
          (sum: number, fw: any) => sum + (fw.count || 0),
          0,
        ) || 0;
      return Math.round((fillers / total) * 100);
    });

    const paceTrend = last7.map(
      (s) => s.analysis?.speakingRate?.wordsPerMinute || 0,
    );

    const scoreTrend = last7.map((s) => s.aiFeedback?.overallScore || 0);

    // Practice by mode
    const practiceByMode = sessions.reduce(
      (acc, s) => {
        const mode = s.practiceMode || "free";
        if (mode === "free") acc.free++;
        else if (mode === "structured") acc.structured++;
        else if (mode === "challenge") acc.challenge++;
        return acc;
      },
      { free: 0, structured: 0, challenge: 0 },
    );

    return {
      totalSessions: sessions.length,
      totalPracticeMinutes,
      sessionsThisWeek,
      sessionsLastWeek,
      weekOverWeekChange,
      currentStreak,
      averageScore,
      averagePace,
      averageFillerRatio,
      scoreImprovement,
      topChallenge,
      fillerWordTrend,
      paceTrend,
      scoreTrend,
      practiceByMode,
    };
  }, [sessions]);
}
