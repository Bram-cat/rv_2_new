import { View, Text, ScrollView, TouchableOpacity, Modal } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  DocumentTextIcon,
  ExclamationCircleIcon,
  MicrophoneIcon,
  SparklesIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  LightBulbIcon,
  ChatBubbleLeftEllipsisIcon,
  PencilSquareIcon,
  InformationCircleIcon,
  TrophyIcon,
  ChartBarIcon,
  XMarkIcon,
  CheckCircleIcon,
  FaceSmileIcon,
  SpeakerWaveIcon,
  AcademicCapIcon,
  BookOpenIcon,
  EyeIcon,
  LanguageIcon,
} from "react-native-heroicons/outline";

import { useAuth } from "@clerk/clerk-expo";
import { useTranscription } from "../../src/hooks/useTranscription";
import {
  useSpeechAnalysis,
  analyzeSpeech,
} from "../../src/hooks/useSpeechAnalysis";
import { useStorage } from "../../src/hooks/useStorage";
import { getSession } from "../../src/services/storage/asyncStorage";
import { RecordingSession } from "../../src/types/recording";

import { MetricsCard } from "../../src/components/analysis/MetricsCard";
import { TranscriptView } from "../../src/components/analysis/TranscriptView";
import { Button } from "../../src/components/ui/Button";
import { LoadingSpinner } from "../../src/components/ui/LoadingSpinner";
import { ProgressBar } from "../../src/components/ui/ProgressBar";
import { useThemedAlert } from "../../src/components/ui/ThemedAlert";

import { SPEAKING_RATE_CONFIG } from "../../src/constants/thresholds";
import { getTotalFillerCount } from "../../src/analysis/fillerWords";
import {
  analyzeSpeechWithAI,
  SpeechFeedback,
  ScoreBreakdown,
  isOpenAIConfigured,
  observePracticeSpeech,
  PracticeObservation,
} from "../../src/services/openai/analyze";
import {
  buildUserProfile,
  buildAIContext,
  getCoachingKnowledge,
  addCoachingKnowledge,
} from "../../src/services/openai/coachingContext";
import {
  calculateChallengeScore,
  getChallengeById,
} from "../../src/constants/challenges";
import * as Speech from "expo-speech";
import {
  getAnalysisCount,
  incrementAnalysisCount,
  hasReachedFreeLimit,
  FREE_LIMIT,
} from "../../src/services/paywall/usage";
import { checkProStatus } from "../../src/services/paywall/revenueCat";

// Filler words display with grouped counts and bars
function FillerWordsDisplay({ fillerWords }: { fillerWords: string[] }) {
  // Group and count
  const counts: Record<string, number> = {};
  fillerWords.forEach((w) => {
    const word = w.toLowerCase().replace(/[^a-z]/g, "");
    if (word) counts[word] = (counts[word] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = fillerWords.length;
  const maxCount = sorted.length > 0 ? sorted[0][1] : 1;

  return (
    <View
      className="p-4 rounded-xl"
      style={{
        backgroundColor: "#1a1a2e",
        borderWidth: 1,
        borderColor: "#fb850030",
      }}
    >
      <View className="flex-row items-center justify-between mb-4">
        <Text
          className="text-sm"
          style={{ fontFamily: "CabinetGrotesk-Bold", color: "#ffffff" }}
        >
          Filler Words
        </Text>
        <View
          className="px-3 py-1 rounded-full"
          style={{
            backgroundColor:
              total > 5 ? "#fb8500" : total > 2 ? "#ffb703" : "#22c55e",
          }}
        >
          <Text
            className="text-xs"
            style={{
              fontFamily: "CabinetGrotesk-Bold",
              color: total > 5 ? "#ffffff" : "#023047",
            }}
          >
            {total} total
          </Text>
        </View>
      </View>
      {sorted.map(([word, count]) => (
        <View key={word} className="flex-row items-center mb-3">
          <View
            className="w-16 px-2 py-1 rounded-md mr-3"
            style={{ backgroundColor: "#ffffff10" }}
          >
            <Text
              className="text-sm text-center"
              style={{ fontFamily: "CabinetGrotesk-Medium", color: "#ffffff" }}
            >
              {word}
            </Text>
          </View>
          <View
            className="flex-1 mr-3 h-5 rounded-md overflow-hidden"
            style={{ backgroundColor: "#ffffff10" }}
          >
            <View
              className="h-full rounded-md items-center justify-center"
              style={{
                width: `${Math.max((count / maxCount) * 100, 15)}%`,
                backgroundColor:
                  count >= 5 ? "#fb8500" : count >= 3 ? "#ffb703" : "#219ebc",
              }}
            >
              {count >= 2 && (
                <Text
                  className="text-xs"
                  style={{
                    fontFamily: "CabinetGrotesk-Bold",
                    color: count >= 3 ? "#023047" : "#ffffff",
                  }}
                >
                  {count}x
                </Text>
              )}
            </View>
          </View>
          {count < 2 && (
            <Text
              className="text-sm w-8 text-right"
              style={{ fontFamily: "CabinetGrotesk-Bold", color: "#ffffff" }}
            >
              {count}x
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

// Score detail modal component - shows all breakdowns at once
function ScoreDetailModal({
  visible,
  onClose,
  breakdowns,
  highlightCategory,
}: {
  visible: boolean;
  onClose: () => void;
  breakdowns: ScoreBreakdown[];
  highlightCategory?: string;
}) {
  if (!breakdowns || breakdowns.length === 0) return null;

  const getScoreColor = (score: number) =>
    score >= 8 ? "#22c55e" : score >= 5 ? "#ffb703" : "#fb8500";

  const getCategoryIcon = (category: string) => {
    if (category.includes("Clarity")) return "eye";
    if (category.includes("Pace")) return "clock";
    if (category.includes("Confidence")) return "fire";
    return "chart";
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <View
          className="bg-primary rounded-t-3xl p-6"
          style={{ maxHeight: "85%" }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text
              className="text-xl text-white"
              style={{ fontFamily: "CabinetGrotesk-Bold" }}
            >
              Score Breakdown
            </Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <XMarkIcon size={24} color="#8ecae6" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {breakdowns
              .filter((b) => b.category !== "Content & Structure")
              .map((breakdown, index) => {
                const scoreColor = getScoreColor(breakdown.currentScore);
                const isHighlighted = breakdown.category === highlightCategory;

                return (
                  <View
                    key={breakdown.category}
                    className="mb-4 rounded-xl p-4"
                    style={{
                      backgroundColor: isHighlighted ? "#034569" : "#011627",
                      borderWidth: isHighlighted ? 1 : 0,
                      borderColor: scoreColor,
                    }}
                  >
                    {/* Category header with score */}
                    <View className="flex-row items-center justify-between mb-3">
                      <Text
                        className="text-base"
                        style={{
                          fontFamily: "CabinetGrotesk-Bold",
                          color: scoreColor,
                        }}
                      >
                        {breakdown.category}
                      </Text>
                      <Text
                        className="text-2xl"
                        style={{
                          fontFamily: "CabinetGrotesk-Bold",
                          color: scoreColor,
                        }}
                      >
                        {breakdown.currentScore}/{breakdown.maxScore}
                      </Text>
                    </View>

                    {/* Issue */}
                    <View className="flex-row items-start mb-2">
                      <ArrowTrendingUpIcon size={14} color="#fb8500" />
                      <Text
                        className="ml-2 flex-1 text-sm"
                        style={{
                          fontFamily: "CabinetGrotesk-Light",
                          color: "#8ecae6",
                        }}
                      >
                        {breakdown.whatToImprove}
                      </Text>
                    </View>

                    {/* Fix */}
                    <View className="flex-row items-start">
                      <CheckCircleIcon size={14} color="#22c55e" />
                      <Text
                        className="ml-2 flex-1 text-sm"
                        style={{
                          fontFamily: "CabinetGrotesk-Light",
                          color: "#8ecae6",
                        }}
                      >
                        {breakdown.howToGetFullMarks}
                      </Text>
                    </View>
                  </View>
                );
              })}
          </ScrollView>

          <TouchableOpacity
            onPress={onClose}
            className="py-4 items-center rounded-xl mt-2"
            style={{ backgroundColor: "#219ebc" }}
          >
            <Text
              className="text-white text-base"
              style={{ fontFamily: "CabinetGrotesk-Bold" }}
            >
              Got it
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function AnalysisScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showAlert } = useThemedAlert();
  const { userId } = useAuth();

  // State
  const [session, setSession] = useState<RecordingSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // AI Analysis State
  const [aiFeedback, setAiFeedback] = useState<SpeechFeedback | null>(null);
  const [practiceObservation, setPracticeObservation] =
    useState<PracticeObservation | null>(null);
  const [isAnalyzingWithAI, setIsAnalyzingWithAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Score detail modal
  const [highlightCategory, setHighlightCategory] = useState<
    string | undefined
  >(undefined);
  const [showScoreDetail, setShowScoreDetail] = useState(false);

  // Paywall
  const [isProUser, setIsProUser] = useState(false);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);

  // TTS
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleReadAloud = useCallback(() => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    let text = "";
    if (practiceObservation) {
      text = `This was detected as a ${practiceObservation.conversationType || "general"} conversation. `;
      text += `Pace: ${practiceObservation.pace} out of 10. Confidence: ${practiceObservation.confidence} out of 10. `;
      if (practiceObservation.clarity) {
        text += `Clarity: ${practiceObservation.clarity} out of 10. `;
      }
      if (practiceObservation.vocabularyRichness) {
        text += `Vocabulary richness: ${practiceObservation.vocabularyRichness} out of 10. `;
      }
      if (practiceObservation.quickTips?.length > 0) {
        text += practiceObservation.quickTips.join(". ") + ". ";
      }
      if (practiceObservation.speakerInsight) {
        text += `Pro tip from ${practiceObservation.speakerInsight.speaker}: using their ${practiceObservation.speakerInsight.technique} technique, instead of saying "${practiceObservation.speakerInsight.originalLine}", try saying "${practiceObservation.speakerInsight.improvedLine}". `;
      }
      if (practiceObservation.fillerWordCount > 0) {
        text += `You used ${practiceObservation.fillerWordCount} filler words. `;
      }
      if (practiceObservation.vocabularyBoost) {
        text += `Word of the day: ${practiceObservation.vocabularyBoost.word}. It means ${practiceObservation.vocabularyBoost.meaning}. For example: ${practiceObservation.vocabularyBoost.useInSentence}`;
      }
    } else if (aiFeedback) {
      text = `Overall score: ${aiFeedback.overallScore} out of 10. `;
      text += `${aiFeedback.summary} `;
      if (aiFeedback.strengths.length > 0) {
        text += `Strengths: ${aiFeedback.strengths.join(". ")}. `;
      }
      if (aiFeedback.improvements.length > 0) {
        text += `Areas to improve: ${aiFeedback.improvements.join(". ")}. `;
      }
      if (aiFeedback.tips.length > 0) {
        text += `Tips: ${aiFeedback.tips.join(". ")}. `;
      }
      if (aiFeedback.vocabularyBoost) {
        text += `Vocabulary boost: ${aiFeedback.vocabularyBoost.word}. It means ${aiFeedback.vocabularyBoost.meaning}. For example: ${aiFeedback.vocabularyBoost.useInSentence}`;
      }
    }

    if (text) {
      Speech.speak(text, {
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
      });
      setIsSpeaking(true);
    }
  }, [isSpeaking, practiceObservation, aiFeedback]);

  // Stop TTS on unmount
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  // Hooks
  const {
    result: transcription,
    isLoading: isTranscribing,
    error: transcriptionError,
    progress,
    isConfigured,
    transcribe,
  } = useTranscription();

  const { sessions, updateSession } = useStorage();

  // Compute analysis from transcription
  const analysis = useSpeechAnalysis(
    transcription || session?.transcription || null,
  );

  // Run AI analysis when transcription is available
  // Takes loadedSession directly to avoid stale closure on session state
  const runAIAnalysis = useCallback(
    async (
      text: string,
      durationSec: number,
      loadedSession: RecordingSession,
      sentimentData?: any[],
      speechCtx?: any,
    ) => {
      if (!isOpenAIConfigured()) {
        setAiError(
          "OpenAI not configured. Add EXPO_PUBLIC_OPENAI_API_KEY to .env",
        );
        return;
      }

      // Check paywall before running AI analysis
      if (!isProUser) {
        const limitReached = await hasReachedFreeLimit();
        if (limitReached) {
          setShowPaywall(true);
          router.push("/paywall");
          return;
        }
      }

      setIsAnalyzingWithAI(true);
      setAiError(null);

      console.log(
        "[AI] runAIAnalysis called. practiceMode:",
        loadedSession.practiceMode,
        "text length:",
        text.length,
        "duration:",
        durationSec,
      );

      try {
        // Build coaching context from user history + training data
        const userProfile = buildUserProfile(sessions);
        const coachingKnowledge = await getCoachingKnowledge();
        const aiContext = buildAIContext(userProfile, coachingKnowledge);

        const isPractice = loadedSession.practiceMode === "free";
        console.log("[AI] isPractice:", isPractice);

        if (isPractice) {
          // Practice mode: observe and learn patterns, don't judge
          const observation = await observePracticeSpeech(
            text,
            durationSec,
            aiContext || undefined,
          );
          console.log(
            "[AI] Practice observation received:",
            JSON.stringify({
              pace: observation.pace,
              confidence: observation.confidence,
              clarity: observation.clarity,
            }),
          );
          setPracticeObservation(observation);

          // Track usage for paywall
          const newCount = await incrementAnalysisCount();
          setAnalysisCount(newCount);

          // Save observation as coaching knowledge so AI learns the user's style
          if (id) {
            const practiceDate = new Date(
              loadedSession.createdAt,
            ).toLocaleDateString();
            const durationMin = Math.round(durationSec / 60);
            const knowledgeEntry = [
              `Practice (${practiceDate}, ${durationMin}min):`,
              observation.fillerWords.length > 0
                ? `Fillers: ${observation.fillerWords.join(", ")}`
                : "",
              `Pace: ${observation.pace}/10 | Confidence: ${observation.confidence}/10`,
              `Transcript excerpt: "${text.substring(0, 300)}${text.length > 300 ? "..." : ""}"`,
            ]
              .filter(Boolean)
              .join("\n");

            await addCoachingKnowledge(knowledgeEntry, "practice-observation");
            await updateSession(id, {});
          }
        } else {
          // Analysis mode: full detailed feedback
          const feedback = await analyzeSpeechWithAI(
            text,
            durationSec,
            sentimentData,
            speechCtx,
            aiContext || undefined,
          );
          setAiFeedback(feedback);

          // Track usage for paywall
          const newCount = await incrementAnalysisCount();
          setAnalysisCount(newCount);

          // Save AI feedback to session
          if (id) {
            const updates: Partial<RecordingSession> = { aiFeedback: feedback };

            // If this is a challenge session, calculate the challenge score
            if (
              loadedSession.practiceMode === "challenge" &&
              loadedSession.challengeType
            ) {
              const challenge = getChallengeById(loadedSession.challengeType);
              if (challenge) {
                let actualValue = 0;
                switch (challenge.scoringMetric) {
                  case "fillerRatio":
                    actualValue =
                      (feedback.fillerWordCount || 0) /
                      Math.max(text.split(/\s+/).length, 1);
                    break;
                  case "clarity":
                    actualValue = feedback.clarity || 0;
                    break;
                  case "paceVariance":
                    actualValue = 10 - (feedback.pace || 5);
                    break;
                }
                const challengeScore = calculateChallengeScore(
                  loadedSession.challengeType,
                  actualValue,
                );
                updates.challengeScore = challengeScore;
              }
            }

            await updateSession(id, updates);
            setSession((prev) => (prev ? { ...prev, ...updates } : null));
          }
        }
      } catch (error) {
        console.error("AI Analysis error:", error);
        setAiError(
          error instanceof Error ? error.message : "AI analysis failed",
        );
      } finally {
        setIsAnalyzingWithAI(false);
      }
    },
    [id, sessions, updateSession],
  );

  // Check paywall status on mount and when returning from paywall
  useFocusEffect(
    useCallback(() => {
      async function checkPaywall() {
        const count = await getAnalysisCount();
        setAnalysisCount(count);
        const isPro = await checkProStatus();
        setIsProUser(isPro);
        if (isPro) {
          setShowPaywall(false);
        }
      }
      checkPaywall();
    }, []),
  );

  // Load session on mount
  useEffect(() => {
    async function loadSession() {
      if (!id) return;

      setIsLoadingSession(true);
      try {
        const loaded = await getSession(id, userId);
        console.log(
          "[Load] Session loaded. practiceMode:",
          loaded?.practiceMode,
          "hasTranscription:",
          !!loaded?.transcription,
          "hasAiFeedback:",
          !!loaded?.aiFeedback,
          "hasAudioUri:",
          !!loaded?.audioUri,
        );
        setSession(loaded);

        // Load existing AI feedback if available
        if (loaded?.aiFeedback) {
          setAiFeedback(loaded.aiFeedback);
        }

        // If session has transcription but no analysis, compute it
        if (loaded?.transcription && !loaded.analysis) {
          const computedAnalysis = analyzeSpeech(loaded.transcription);
          if (computedAnalysis) {
            await updateSession(id, { analysis: computedAnalysis });
            setSession((prev) =>
              prev ? { ...prev, analysis: computedAnalysis } : null,
            );
          }
          // Also run AI analysis if no existing feedback
          if (!loaded.aiFeedback) {
            const sentimentData = loaded.transcription.sentimentAnalysis?.map(
              (s) => ({
                text: s.text,
                sentiment: s.sentiment,
                confidence: s.confidence,
              }),
            );
            const speechCtx = (loaded as any).speechContext;
            runAIAnalysis(
              loaded.transcription.text,
              loaded.duration / 1000,
              loaded,
              sentimentData,
              speechCtx,
            );
          }
        }

        // If no transcription yet and we have an audio file, start transcribing
        if (loaded && !loaded.transcription && loaded.audioUri) {
          startTranscription(loaded.audioUri, loaded.duration, loaded);
        }
      } catch (error) {
        console.error("Error loading session:", error);
      } finally {
        setIsLoadingSession(false);
      }
    }

    loadSession();
  }, [id, userId]);

  // Start transcription
  const startTranscription = useCallback(
    async (
      audioUri: string,
      durationMs: number,
      loadedSession: RecordingSession,
    ) => {
      if (!isConfigured) {
        showAlert({
          title: "Configuration Required",
          message:
            "Please add your AssemblyAI API key to the .env file to enable speech-to-text.",
          type: "warning",
        });
        return;
      }

      const result = await transcribe(audioUri);
      if (result && id) {
        // Compute analysis
        const computedAnalysis = analyzeSpeech(result);

        // Save to storage
        await updateSession(id, {
          transcription: result,
          analysis: computedAnalysis,
        });

        // Update local state
        setSession((prev) =>
          prev
            ? { ...prev, transcription: result, analysis: computedAnalysis }
            : null,
        );

        // Run AI analysis with sentiment data
        const durationSec = durationMs / 1000;
        const sentimentData = result.sentimentAnalysis?.map((s) => ({
          text: s.text,
          sentiment: s.sentiment,
          confidence: s.confidence,
        }));
        const speechCtx = (loadedSession as any).speechContext;
        runAIAnalysis(
          result.text,
          durationSec,
          loadedSession,
          sentimentData,
          speechCtx,
        );
      }
    },
    [id, isConfigured, transcribe, updateSession, runAIAnalysis],
  );

  // Retry transcription
  const handleRetry = useCallback(() => {
    if (session?.audioUri) {
      startTranscription(session.audioUri, session.duration, session);
    }
  }, [session, startTranscription]);

  // Retry AI analysis
  const handleRetryAI = useCallback(() => {
    const displayTranscription = transcription || session?.transcription;
    if (displayTranscription && session) {
      const sentimentData = displayTranscription.sentimentAnalysis?.map(
        (s) => ({
          text: s.text,
          sentiment: s.sentiment,
          confidence: s.confidence,
        }),
      );
      const speechCtx = (session as any).speechContext;
      runAIAnalysis(
        displayTranscription.text,
        session.duration / 1000,
        session,
        sentimentData,
        speechCtx,
      );
    }
  }, [transcription, session, runAIAnalysis]);

  // Handle score tap - shows all breakdowns with tapped one highlighted
  const handleScoreTap = (category: string) => {
    if (aiFeedback?.scoreBreakdown && aiFeedback.scoreBreakdown.length > 0) {
      setHighlightCategory(category);
      setShowScoreDetail(true);
    }
  };

  // Loading state
  if (isLoadingSession) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: "#ffb703" }}
          >
            <DocumentTextIcon size={40} color="#023047" />
          </View>
          <LoadingSpinner message="Loading session..." />
        </View>
      </SafeAreaView>
    );
  }

  // Session not found
  if (!session) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center px-6">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: "#fb850030" }}
          >
            <ExclamationCircleIcon size={40} color="#fb8500" />
          </View>
          <Text
            className="text-xl text-white mb-2"
            style={{ fontFamily: "CabinetGrotesk-Bold" }}
          >
            Session Not Found
          </Text>
          <Text
            className="text-secondary-light text-center mb-6"
            style={{ fontFamily: "CabinetGrotesk-Light" }}
          >
            This recording session could not be found.
          </Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  // Transcribing state
  if (isTranscribing) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center px-6">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: "#219ebc" }}
          >
            <MicrophoneIcon size={40} color="#ffffff" />
          </View>
          <LoadingSpinner
            message={
              progress === "uploading"
                ? "Uploading audio..."
                : "Transcribing your speech..."
            }
          />
          <Text
            className="text-sm mt-4 text-center"
            style={{
              fontFamily: "CabinetGrotesk-Light",
              color: "#8ecae6",
            }}
          >
            This may take a moment depending on the recording length
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Transcription error
  if (transcriptionError && !session.transcription) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center px-6">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: "#fb850030" }}
          >
            <ExclamationCircleIcon size={40} color="#fb8500" />
          </View>
          <Text
            className="text-xl text-white mb-2"
            style={{ fontFamily: "CabinetGrotesk-Bold" }}
          >
            Analysis Failed
          </Text>
          <Text
            className="text-secondary-light text-center mb-6"
            style={{ fontFamily: "CabinetGrotesk-Light" }}
          >
            {transcriptionError}
          </Text>
          <View className="gap-3 w-full">
            <Button title="Try Again" onPress={handleRetry} />
            <Button
              title="Go Back"
              onPress={() => router.back()}
              variant="secondary"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Get the analysis data (from hook or session)
  const displayAnalysis = analysis || session.analysis;
  const displayTranscription = transcription || session.transcription;

  // No analysis yet
  if (!displayAnalysis || !displayTranscription) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center px-6">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: "#219ebc30" }}
          >
            <ChartBarIcon size={40} color="#219ebc" />
          </View>
          <Text
            className="text-xl text-white mb-2"
            style={{ fontFamily: "CabinetGrotesk-Bold" }}
          >
            No Analysis Available
          </Text>
          <Text
            className="text-secondary-light text-center mb-6"
            style={{ fontFamily: "CabinetGrotesk-Light" }}
          >
            {isConfigured
              ? "Unable to analyze this recording."
              : "Please configure AssemblyAI API key to enable analysis."}
          </Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  // Sentiment summary from transcription
  const sentimentResults = displayTranscription.sentimentAnalysis;
  const sentimentSummary = sentimentResults
    ? {
        positive: sentimentResults.filter((s) => s.sentiment === "POSITIVE")
          .length,
        neutral: sentimentResults.filter((s) => s.sentiment === "NEUTRAL")
          .length,
        negative: sentimentResults.filter((s) => s.sentiment === "NEGATIVE")
          .length,
        total: sentimentResults.length,
      }
    : null;

  // Full analysis view
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-4">
          {/* Practice Observation View - different from analysis */}
          {session?.practiceMode === "free" && (
            <View
              className="bg-background-card rounded-2xl p-5 mb-6 border border-secondary/20"
              style={{ borderColor: "#ffb70340" }}
            >
              <View className="flex-row items-center mb-4">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: "#ffb703" }}
                >
                  <AcademicCapIcon size={20} color="#023047" />
                </View>
                <View className="ml-3 flex-1">
                  <Text
                    className="text-lg text-white"
                    style={{ fontFamily: "CabinetGrotesk-Bold" }}
                  >
                    Practice Session
                  </Text>
                  <Text
                    className="text-xs"
                    style={{
                      fontFamily: "CabinetGrotesk-Light",
                      color: "#ffb703",
                    }}
                  >
                    AI is observing your patterns
                  </Text>
                </View>
                {(practiceObservation || aiFeedback) && (
                  <TouchableOpacity
                    onPress={handleReadAloud}
                    className="p-2 rounded-full"
                    style={{
                      backgroundColor: isSpeaking ? "#ffb703" : "#ffb70320",
                    }}
                    activeOpacity={0.7}
                  >
                    <SpeakerWaveIcon
                      size={18}
                      color={isSpeaking ? "#023047" : "#ffb703"}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {isAnalyzingWithAI && (
                <View className="items-center py-4">
                  <LoadingSpinner message="Observing your speech..." />
                </View>
              )}

              {aiError && !practiceObservation && (
                <View
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: "#fb850030" }}
                >
                  <Text
                    className="mb-2"
                    style={{
                      fontFamily: "CabinetGrotesk-Regular",
                      color: "#fb8500",
                    }}
                  >
                    {aiError}
                  </Text>
                  <Button
                    title="Retry"
                    onPress={handleRetryAI}
                    variant="secondary"
                    size="small"
                  />
                </View>
              )}

              {/* Speaking Stats - ALWAYS show when local analysis is available */}
              {displayAnalysis && (
                <View className="flex-row gap-2 mb-4">
                  <View
                    className="flex-1 p-3 rounded-xl items-center"
                    style={{
                      backgroundColor: "#1a1a2e",
                      borderWidth: 1,
                      borderColor: "#ffffff08",
                    }}
                  >
                    <Text
                      className="text-lg"
                      style={{
                        fontFamily: "CabinetGrotesk-Bold",
                        color: "#ffb703",
                      }}
                    >
                      {displayAnalysis.speakingRate.wordsPerMinute}
                    </Text>
                    <Text
                      className="text-xs"
                      style={{
                        fontFamily: "CabinetGrotesk-Light",
                        color: "#8ecae6",
                      }}
                    >
                      WPM
                    </Text>
                  </View>
                  <View
                    className="flex-1 p-3 rounded-xl items-center"
                    style={{
                      backgroundColor: "#1a1a2e",
                      borderWidth: 1,
                      borderColor: "#ffffff08",
                    }}
                  >
                    <Text
                      className="text-lg"
                      style={{
                        fontFamily: "CabinetGrotesk-Bold",
                        color: "#ffb703",
                      }}
                    >
                      {displayAnalysis.speakingRate.totalWords}
                    </Text>
                    <Text
                      className="text-xs"
                      style={{
                        fontFamily: "CabinetGrotesk-Light",
                        color: "#8ecae6",
                      }}
                    >
                      Words
                    </Text>
                  </View>
                  <View
                    className="flex-1 p-3 rounded-xl items-center"
                    style={{
                      backgroundColor: "#1a1a2e",
                      borderWidth: 1,
                      borderColor: "#ffffff08",
                    }}
                  >
                    <Text
                      className="text-lg"
                      style={{
                        fontFamily: "CabinetGrotesk-Bold",
                        color: "#ffb703",
                      }}
                    >
                      {displayAnalysis.pauseStats.count}
                    </Text>
                    <Text
                      className="text-xs"
                      style={{
                        fontFamily: "CabinetGrotesk-Light",
                        color: "#8ecae6",
                      }}
                    >
                      Pauses
                    </Text>
                  </View>
                  <View
                    className="flex-1 p-3 rounded-xl items-center"
                    style={{
                      backgroundColor: "#1a1a2e",
                      borderWidth: 1,
                      borderColor: "#ffffff08",
                    }}
                  >
                    <Text
                      className="text-lg"
                      style={{
                        fontFamily: "CabinetGrotesk-Bold",
                        color:
                          getTotalFillerCount(displayAnalysis.fillerWords) > 5
                            ? "#fb8500"
                            : getTotalFillerCount(displayAnalysis.fillerWords) >
                                2
                              ? "#ffb703"
                              : "#22c55e",
                      }}
                    >
                      {getTotalFillerCount(displayAnalysis.fillerWords)}
                    </Text>
                    <Text
                      className="text-xs"
                      style={{
                        fontFamily: "CabinetGrotesk-Light",
                        color: "#8ecae6",
                      }}
                    >
                      Fillers
                    </Text>
                  </View>
                </View>
              )}

              {practiceObservation && (
                <View>
                  {/* Conversation type badge */}
                  {practiceObservation.conversationType && (
                    <View
                      className="flex-row items-center mb-4 px-3 py-2 rounded-lg self-start"
                      style={{
                        backgroundColor: "#219ebc20",
                        borderWidth: 1,
                        borderColor: "#219ebc30",
                      }}
                    >
                      <ChatBubbleLeftEllipsisIcon size={14} color="#219ebc" />
                      <Text
                        className="ml-2 text-xs"
                        style={{
                          fontFamily: "CabinetGrotesk-Bold",
                          color: "#219ebc",
                        }}
                      >
                        {practiceObservation.conversationType
                          .charAt(0)
                          .toUpperCase() +
                          practiceObservation.conversationType.slice(1)}
                      </Text>
                    </View>
                  )}

                  {/* === AI SCORE BENTO GRID === */}
                  {/* Row 1: Pace + Confidence */}
                  <View className="flex-row gap-3 mb-3">
                    <View
                      className="flex-1 p-4 rounded-xl"
                      style={{
                        backgroundColor: "#1a1a2e",
                        borderWidth: 1,
                        borderColor: "#219ebc25",
                      }}
                    >
                      <View className="flex-row items-center justify-between mb-1">
                        <Text
                          className="text-xs"
                          style={{
                            fontFamily: "CabinetGrotesk-Medium",
                            color: "#8ecae6",
                          }}
                        >
                          Pace
                        </Text>
                        <View
                          className="w-5 h-5 rounded-full items-center justify-center"
                          style={{ backgroundColor: "#219ebc" }}
                        >
                          <ArrowTrendingUpIcon size={10} color="#ffffff" />
                        </View>
                      </View>
                      <Text
                        className="text-3xl"
                        style={{
                          fontFamily: "CabinetGrotesk-Bold",
                          color:
                            practiceObservation.pace >= 7
                              ? "#22c55e"
                              : practiceObservation.pace >= 5
                                ? "#ffb703"
                                : "#fb8500",
                        }}
                      >
                        {practiceObservation.pace}
                        <Text
                          className="text-sm"
                          style={{ color: "#8ecae680" }}
                        >
                          /10
                        </Text>
                      </Text>
                      <View
                        className="mt-2 h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: "#ffffff10" }}
                      >
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: `${practiceObservation.pace * 10}%`,
                            backgroundColor:
                              practiceObservation.pace >= 7
                                ? "#22c55e"
                                : practiceObservation.pace >= 5
                                  ? "#ffb703"
                                  : "#fb8500",
                          }}
                        />
                      </View>
                    </View>

                    <View
                      className="flex-1 p-4 rounded-xl"
                      style={{
                        backgroundColor: "#1a1a2e",
                        borderWidth: 1,
                        borderColor: "#fb850025",
                      }}
                    >
                      <View className="flex-row items-center justify-between mb-1">
                        <Text
                          className="text-xs"
                          style={{
                            fontFamily: "CabinetGrotesk-Medium",
                            color: "#8ecae6",
                          }}
                        >
                          Confidence
                        </Text>
                        <View
                          className="w-5 h-5 rounded-full items-center justify-center"
                          style={{ backgroundColor: "#fb8500" }}
                        >
                          <StarIcon size={10} color="#ffffff" />
                        </View>
                      </View>
                      <Text
                        className="text-3xl"
                        style={{
                          fontFamily: "CabinetGrotesk-Bold",
                          color:
                            practiceObservation.confidence >= 7
                              ? "#22c55e"
                              : practiceObservation.confidence >= 5
                                ? "#ffb703"
                                : "#fb8500",
                        }}
                      >
                        {practiceObservation.confidence}
                        <Text
                          className="text-sm"
                          style={{ color: "#8ecae680" }}
                        >
                          /10
                        </Text>
                      </Text>
                      <View
                        className="mt-2 h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: "#ffffff10" }}
                      >
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: `${practiceObservation.confidence * 10}%`,
                            backgroundColor:
                              practiceObservation.confidence >= 7
                                ? "#22c55e"
                                : practiceObservation.confidence >= 5
                                  ? "#ffb703"
                                  : "#fb8500",
                          }}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Row 2: Clarity + Vocabulary Richness */}
                  <View className="flex-row gap-3 mb-3">
                    <View
                      className="flex-1 p-4 rounded-xl"
                      style={{
                        backgroundColor: "#1a1a2e",
                        borderWidth: 1,
                        borderColor: "#8ecae625",
                      }}
                    >
                      <View className="flex-row items-center justify-between mb-1">
                        <Text
                          className="text-xs"
                          style={{
                            fontFamily: "CabinetGrotesk-Medium",
                            color: "#8ecae6",
                          }}
                        >
                          Clarity
                        </Text>
                        <View
                          className="w-5 h-5 rounded-full items-center justify-center"
                          style={{ backgroundColor: "#8ecae6" }}
                        >
                          <EyeIcon size={10} color="#023047" />
                        </View>
                      </View>
                      <Text
                        className="text-3xl"
                        style={{
                          fontFamily: "CabinetGrotesk-Bold",
                          color:
                            (practiceObservation.clarity || 0) >= 7
                              ? "#22c55e"
                              : (practiceObservation.clarity || 0) >= 5
                                ? "#ffb703"
                                : "#fb8500",
                        }}
                      >
                        {practiceObservation.clarity || "—"}
                        <Text
                          className="text-sm"
                          style={{ color: "#8ecae680" }}
                        >
                          /10
                        </Text>
                      </Text>
                      <View
                        className="mt-2 h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: "#ffffff10" }}
                      >
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: `${(practiceObservation.clarity || 0) * 10}%`,
                            backgroundColor:
                              (practiceObservation.clarity || 0) >= 7
                                ? "#22c55e"
                                : (practiceObservation.clarity || 0) >= 5
                                  ? "#ffb703"
                                  : "#fb8500",
                          }}
                        />
                      </View>
                    </View>

                    <View
                      className="flex-1 p-4 rounded-xl"
                      style={{
                        backgroundColor: "#1a1a2e",
                        borderWidth: 1,
                        borderColor: "#22c55e25",
                      }}
                    >
                      <View className="flex-row items-center justify-between mb-1">
                        <Text
                          className="text-xs"
                          style={{
                            fontFamily: "CabinetGrotesk-Medium",
                            color: "#8ecae6",
                          }}
                        >
                          Vocabulary
                        </Text>
                        <View
                          className="w-5 h-5 rounded-full items-center justify-center"
                          style={{ backgroundColor: "#22c55e" }}
                        >
                          <LanguageIcon size={10} color="#ffffff" />
                        </View>
                      </View>
                      <Text
                        className="text-3xl"
                        style={{
                          fontFamily: "CabinetGrotesk-Bold",
                          color:
                            (practiceObservation.vocabularyRichness || 0) >= 7
                              ? "#22c55e"
                              : (practiceObservation.vocabularyRichness || 0) >=
                                  5
                                ? "#ffb703"
                                : "#fb8500",
                        }}
                      >
                        {practiceObservation.vocabularyRichness || "—"}
                        <Text
                          className="text-sm"
                          style={{ color: "#8ecae680" }}
                        >
                          /10
                        </Text>
                      </Text>
                      <View
                        className="mt-2 h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: "#ffffff10" }}
                      >
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: `${(practiceObservation.vocabularyRichness || 0) * 10}%`,
                            backgroundColor:
                              (practiceObservation.vocabularyRichness || 0) >= 7
                                ? "#22c55e"
                                : (practiceObservation.vocabularyRichness ||
                                      0) >= 5
                                  ? "#ffb703"
                                  : "#fb8500",
                          }}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Filler Words Breakdown - full width */}
                  {practiceObservation.fillerWords.length > 0 && (
                    <View className="mb-3">
                      <FillerWordsDisplay
                        fillerWords={practiceObservation.fillerWords}
                      />
                    </View>
                  )}

                  {/* === VOCABULARY BOOST — prominent card === */}
                  {practiceObservation.vocabularyBoost && (
                    <View
                      className="p-5 rounded-xl mb-3"
                      style={{
                        backgroundColor: "#22c55e15",
                        borderWidth: 1.5,
                        borderColor: "#22c55e40",
                      }}
                    >
                      <View className="flex-row items-center mb-3">
                        <View
                          className="w-8 h-8 rounded-full items-center justify-center"
                          style={{ backgroundColor: "#22c55e" }}
                        >
                          <BookOpenIcon size={16} color="#ffffff" />
                        </View>
                        <View className="ml-3">
                          <Text
                            className="text-sm"
                            style={{
                              fontFamily: "CabinetGrotesk-Bold",
                              color: "#22c55e",
                            }}
                          >
                            Level Up Your Vocab
                          </Text>
                          <Text
                            className="text-xs"
                            style={{
                              fontFamily: "CabinetGrotesk-Light",
                              color: "#8ecae6",
                            }}
                          >
                            From communication science
                          </Text>
                        </View>
                      </View>
                      <Text
                        className="text-xl text-white mb-1"
                        style={{ fontFamily: "CabinetGrotesk-Bold" }}
                      >
                        {practiceObservation.vocabularyBoost.word}
                      </Text>
                      <Text
                        className="text-sm mb-3 leading-5"
                        style={{
                          fontFamily: "CabinetGrotesk-Regular",
                          color: "#ffffff",
                        }}
                      >
                        {practiceObservation.vocabularyBoost.meaning}
                      </Text>
                      <View
                        className="p-3 rounded-lg"
                        style={{
                          backgroundColor: "#1a1a2e",
                          borderWidth: 1,
                          borderColor: "#22c55e20",
                        }}
                      >
                        <Text
                          className="text-xs mb-1"
                          style={{
                            fontFamily: "CabinetGrotesk-Bold",
                            color: "#22c55e",
                          }}
                        >
                          Example:
                        </Text>
                        <Text
                          className="text-sm italic leading-5"
                          style={{
                            fontFamily: "CabinetGrotesk-Regular",
                            color: "#8ecae6",
                          }}
                        >
                          "{practiceObservation.vocabularyBoost.useInSentence}"
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Quick Tips */}
                  {practiceObservation.quickTips &&
                    practiceObservation.quickTips.length > 0 && (
                      <View
                        className="p-4 rounded-xl mb-3"
                        style={{
                          backgroundColor: "#1a1a2e",
                          borderWidth: 1,
                          borderColor: "#219ebc25",
                        }}
                      >
                        <View className="flex-row items-center mb-3">
                          <View
                            className="w-7 h-7 rounded-full items-center justify-center"
                            style={{ backgroundColor: "#219ebc" }}
                          >
                            <LightBulbIcon size={14} color="#ffffff" />
                          </View>
                          <Text
                            className="ml-2 text-sm"
                            style={{
                              fontFamily: "CabinetGrotesk-Bold",
                              color: "#219ebc",
                            }}
                          >
                            Quick Tips
                          </Text>
                        </View>
                        {practiceObservation.quickTips.map((tip, i) => (
                          <View key={i} className="flex-row items-start mb-2">
                            <View
                              className="w-5 h-5 rounded-full items-center justify-center mt-0.5 mr-2"
                              style={{ backgroundColor: "#219ebc30" }}
                            >
                              <Text
                                className="text-xs"
                                style={{
                                  fontFamily: "CabinetGrotesk-Bold",
                                  color: "#219ebc",
                                }}
                              >
                                {i + 1}
                              </Text>
                            </View>
                            <Text
                              className="flex-1 text-sm leading-5"
                              style={{
                                fontFamily: "CabinetGrotesk-Regular",
                                color: "#ffffff",
                              }}
                            >
                              {tip}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                  {/* Speaker Insight - TED talk technique */}
                  {practiceObservation.speakerInsight && (
                    <View
                      className="p-4 rounded-xl mb-3"
                      style={{
                        backgroundColor: "#1a1a2e",
                        borderWidth: 1,
                        borderColor: "#ffb70330",
                      }}
                    >
                      <View className="flex-row items-center mb-3">
                        <View
                          className="w-7 h-7 rounded-full items-center justify-center"
                          style={{ backgroundColor: "#ffb703" }}
                        >
                          <AcademicCapIcon size={14} color="#023047" />
                        </View>
                        <Text
                          className="ml-2 text-sm"
                          style={{
                            fontFamily: "CabinetGrotesk-Bold",
                            color: "#ffb703",
                          }}
                        >
                          Learn from the Pros
                        </Text>
                      </View>
                      <Text
                        className="text-sm mb-3"
                        style={{
                          fontFamily: "CabinetGrotesk-Medium",
                          color: "#ffffff",
                        }}
                      >
                        {practiceObservation.speakerInsight.speaker} —{" "}
                        <Text style={{ color: "#8ecae6" }}>
                          {practiceObservation.speakerInsight.technique}
                        </Text>
                      </Text>

                      <View
                        className="p-3 rounded-lg mb-2"
                        style={{
                          backgroundColor: "#fb850015",
                          borderWidth: 1,
                          borderColor: "#fb850020",
                        }}
                      >
                        <Text
                          className="text-xs mb-1"
                          style={{
                            fontFamily: "CabinetGrotesk-Bold",
                            color: "#fb8500",
                          }}
                        >
                          You said:
                        </Text>
                        <Text
                          className="text-sm leading-5"
                          style={{
                            fontFamily: "CabinetGrotesk-Regular",
                            color: "#ffffff",
                          }}
                        >
                          "{practiceObservation.speakerInsight.originalLine}"
                        </Text>
                      </View>

                      <View
                        className="p-3 rounded-lg"
                        style={{
                          backgroundColor: "#22c55e15",
                          borderWidth: 1,
                          borderColor: "#22c55e20",
                        }}
                      >
                        <Text
                          className="text-xs mb-1"
                          style={{
                            fontFamily: "CabinetGrotesk-Bold",
                            color: "#22c55e",
                          }}
                        >
                          Try this instead:
                        </Text>
                        <Text
                          className="text-sm leading-5"
                          style={{
                            fontFamily: "CabinetGrotesk-Regular",
                            color: "#ffffff",
                          }}
                        >
                          "{practiceObservation.speakerInsight.improvedLine}"
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Learning indicator */}
                  <View
                    className="flex-row items-center mt-3 pt-3 border-t"
                    style={{ borderColor: "#034569" }}
                  >
                    <SparklesIcon size={14} color="#ffb703" />
                    <Text
                      className="ml-2 text-xs flex-1"
                      style={{
                        fontFamily: "CabinetGrotesk-Light",
                        color: "#8ecae6",
                      }}
                    >
                      This data is saved to personalize your future sessions
                    </Text>
                  </View>
                </View>
              )}

              {/* Fallback: Get AI Feedback button when nothing loaded */}
              {!practiceObservation &&
                !isAnalyzingWithAI &&
                !aiError &&
                displayTranscription && (
                  <View className="mt-2">
                    <Button
                      title="Get AI Feedback"
                      onPress={handleRetryAI}
                      icon={<SparklesIcon size={20} color="#023047" />}
                    />
                  </View>
                )}

              {/* Recurring Patterns & Improvement */}
              {(() => {
                const profile = buildUserProfile(sessions);
                if (profile.totalSessions < 2) return null;

                const hasFillers = profile.topFillerWords.length > 0;
                const hasLowAreas = profile.lowAreas.length > 0;
                const hasTrend = profile.scoreHistory.length >= 2;

                if (!hasFillers && !hasLowAreas && !hasTrend) return null;

                const first =
                  profile.scoreHistory[profile.scoreHistory.length - 1];
                const latest = profile.scoreHistory[0];
                const trend = first && latest ? latest.score - first.score : 0;

                return (
                  <View
                    className="p-4 rounded-xl mt-3"
                    style={{
                      backgroundColor: "#1a1a2e",
                      borderWidth: 1,
                      borderColor: "#fb850030",
                    }}
                  >
                    <View className="flex-row items-center mb-3">
                      <View
                        className="w-7 h-7 rounded-full items-center justify-center"
                        style={{ backgroundColor: "#fb8500" }}
                      >
                        <ArrowTrendingUpIcon size={14} color="#ffffff" />
                      </View>
                      <Text
                        className="ml-2 text-sm"
                        style={{
                          fontFamily: "CabinetGrotesk-Bold",
                          color: "#fb8500",
                        }}
                      >
                        Your Patterns ({profile.totalSessions} sessions)
                      </Text>
                    </View>

                    {/* Score trend */}
                    {hasTrend && first && latest && (
                      <View
                        className="p-3 rounded-lg mb-3"
                        style={{
                          backgroundColor:
                            trend > 0
                              ? "#22c55e15"
                              : trend < 0
                                ? "#fb850015"
                                : "#8ecae615",
                        }}
                      >
                        <View className="flex-row items-center">
                          <Text
                            className="text-lg mr-2"
                            style={{
                              fontFamily: "CabinetGrotesk-Bold",
                              color:
                                trend > 0
                                  ? "#22c55e"
                                  : trend < 0
                                    ? "#fb8500"
                                    : "#8ecae6",
                            }}
                          >
                            {first.score}/10 → {latest.score}/10
                          </Text>
                          <Text
                            className="text-xs"
                            style={{
                              fontFamily: "CabinetGrotesk-Medium",
                              color:
                                trend > 0
                                  ? "#22c55e"
                                  : trend < 0
                                    ? "#fb8500"
                                    : "#8ecae6",
                            }}
                          >
                            {trend > 0
                              ? `+${trend} improvement!`
                              : trend < 0
                                ? `${trend} decline`
                                : "Steady"}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Recurring filler words */}
                    {hasFillers && (
                      <View className="mb-3">
                        <Text
                          className="text-xs mb-2"
                          style={{
                            fontFamily: "CabinetGrotesk-Bold",
                            color: "#ffb703",
                          }}
                        >
                          Repeat Offender Fillers
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                          {profile.topFillerWords.slice(0, 4).map((f) => (
                            <View
                              key={f.word}
                              className="px-3 py-1.5 rounded-full flex-row items-center"
                              style={{
                                backgroundColor: "#fb850020",
                                borderWidth: 1,
                                borderColor: "#fb850030",
                              }}
                            >
                              <Text
                                className="text-xs"
                                style={{
                                  fontFamily: "CabinetGrotesk-Bold",
                                  color: "#fb8500",
                                }}
                              >
                                "{f.word}"
                              </Text>
                              <Text
                                className="text-xs ml-1"
                                style={{
                                  fontFamily: "CabinetGrotesk-Light",
                                  color: "#8ecae6",
                                }}
                              >
                                {f.count}x total
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Consistently low areas */}
                    {hasLowAreas && (
                      <View>
                        <Text
                          className="text-xs mb-2"
                          style={{
                            fontFamily: "CabinetGrotesk-Bold",
                            color: "#ffb703",
                          }}
                        >
                          Areas Needing Work
                        </Text>
                        {profile.lowAreas.map((area) => (
                          <View
                            key={area.area}
                            className="flex-row items-center justify-between mb-2 p-2 rounded-lg"
                            style={{ backgroundColor: "#ffffff08" }}
                          >
                            <Text
                              className="text-sm"
                              style={{
                                fontFamily: "CabinetGrotesk-Medium",
                                color: "#ffffff",
                              }}
                            >
                              {area.area}
                            </Text>
                            <View className="flex-row items-center">
                              <Text
                                className="text-sm mr-2"
                                style={{
                                  fontFamily: "CabinetGrotesk-Bold",
                                  color:
                                    area.avgScore < 5 ? "#fb8500" : "#ffb703",
                                }}
                              >
                                avg {area.avgScore}/10
                              </Text>
                              <View
                                className="w-16 h-2 rounded-full overflow-hidden"
                                style={{ backgroundColor: "#ffffff10" }}
                              >
                                <View
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${area.avgScore * 10}%`,
                                    backgroundColor:
                                      area.avgScore < 5 ? "#fb8500" : "#ffb703",
                                  }}
                                />
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })()}
            </View>
          )}

          {/* Analysis mode feedback card */}
          {session?.practiceMode !== "free" && (
            <View className="bg-background-card rounded-2xl p-5 mb-6 border border-secondary/20">
              <View className="flex-row items-center mb-4">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: "#ffb703" }}
                >
                  <SparklesIcon size={20} color="#023047" />
                </View>
                <Text
                  className="text-lg text-white ml-3 flex-1"
                  style={{ fontFamily: "CabinetGrotesk-Bold" }}
                >
                  AI Coach Feedback
                </Text>
                {aiFeedback && (
                  <TouchableOpacity
                    onPress={handleReadAloud}
                    className="p-2 rounded-full"
                    style={{
                      backgroundColor: isSpeaking ? "#219ebc" : "#219ebc20",
                    }}
                    activeOpacity={0.7}
                  >
                    <SpeakerWaveIcon
                      size={18}
                      color={isSpeaking ? "#ffffff" : "#219ebc"}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {isAnalyzingWithAI && (
                <View className="items-center py-4">
                  <LoadingSpinner message="Analyzing your speech..." />
                </View>
              )}

              {aiError && !aiFeedback && (
                <View
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: "#fb850030" }}
                >
                  <Text
                    className="mb-2"
                    style={{
                      fontFamily: "CabinetGrotesk-Regular",
                      color: "#fb8500",
                    }}
                  >
                    {aiError}
                  </Text>
                  <Button
                    title="Retry AI Analysis"
                    onPress={handleRetryAI}
                    variant="secondary"
                    size="small"
                  />
                </View>
              )}

              {aiFeedback && (
                <View>
                  {/* AI Score - Tappable to see all breakdowns */}
                  <TouchableOpacity
                    className="flex-row justify-between mb-3 p-4 rounded-xl"
                    style={{ backgroundColor: "#011627" }}
                    onPress={() => handleScoreTap("Clarity")}
                    activeOpacity={0.7}
                  >
                    <View className="flex-1 items-center">
                      <Text
                        className="text-3xl"
                        style={{
                          fontFamily: "CabinetGrotesk-Bold",
                          color: "#ffb703",
                        }}
                      >
                        {aiFeedback.overallScore}/10
                      </Text>
                      <Text
                        className="text-xs"
                        style={{
                          fontFamily: "CabinetGrotesk-Light",
                          color: "#8ecae6",
                        }}
                      >
                        Overall
                      </Text>
                    </View>
                    <View
                      className="flex-1 items-center border-l"
                      style={{ borderColor: "#034569" }}
                    >
                      <Text
                        className="text-xl"
                        style={{
                          fontFamily: "CabinetGrotesk-Bold",
                          color: "#219ebc",
                        }}
                      >
                        {aiFeedback.clarity}/10
                      </Text>
                      <Text
                        className="text-xs"
                        style={{
                          fontFamily: "CabinetGrotesk-Light",
                          color: "#8ecae6",
                        }}
                      >
                        Clarity
                      </Text>
                    </View>
                    <View
                      className="flex-1 items-center border-l"
                      style={{ borderColor: "#034569" }}
                    >
                      <Text
                        className="text-xl"
                        style={{
                          fontFamily: "CabinetGrotesk-Bold",
                          color: "#8ecae6",
                        }}
                      >
                        {aiFeedback.pace}/10
                      </Text>
                      <Text
                        className="text-xs"
                        style={{
                          fontFamily: "CabinetGrotesk-Light",
                          color: "#8ecae6",
                        }}
                      >
                        Pace
                      </Text>
                    </View>
                    <View
                      className="flex-1 items-center border-l"
                      style={{ borderColor: "#034569" }}
                    >
                      <Text
                        className="text-xl"
                        style={{
                          fontFamily: "CabinetGrotesk-Bold",
                          color: "#fb8500",
                        }}
                      >
                        {aiFeedback.confidence}/10
                      </Text>
                      <Text
                        className="text-xs"
                        style={{
                          fontFamily: "CabinetGrotesk-Light",
                          color: "#8ecae6",
                        }}
                      >
                        Confidence
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Tap hint */}
                  {aiFeedback.scoreBreakdown &&
                    aiFeedback.scoreBreakdown.length > 0 && (
                      <Text
                        className="text-xs text-center mb-3"
                        style={{
                          fontFamily: "CabinetGrotesk-Light",
                          color: "#6bb8d4",
                        }}
                      >
                        Tap scores to see full breakdown
                      </Text>
                    )}

                  {/* Summary */}
                  <View
                    className="p-4 rounded-lg mb-4"
                    style={{ backgroundColor: "#219ebc20" }}
                  >
                    <Text
                      className="leading-5"
                      style={{
                        fontFamily: "CabinetGrotesk-Light",
                        color: "#8ecae6",
                      }}
                    >
                      {aiFeedback.summary}
                    </Text>
                  </View>

                  {/* Tone Analysis */}
                  {aiFeedback.toneAnalysis && (
                    <View
                      className="p-4 rounded-lg mb-4"
                      style={{ backgroundColor: "#ffb70315" }}
                    >
                      <View className="flex-row items-center mb-2">
                        <SpeakerWaveIcon size={16} color="#ffb703" />
                        <Text
                          className="ml-2 text-sm"
                          style={{
                            fontFamily: "CabinetGrotesk-Bold",
                            color: "#ffb703",
                          }}
                        >
                          Tone & Delivery
                        </Text>
                      </View>
                      <Text
                        className="leading-5"
                        style={{
                          fontFamily: "CabinetGrotesk-Light",
                          color: "#8ecae6",
                        }}
                      >
                        {aiFeedback.toneAnalysis}
                      </Text>
                    </View>
                  )}

                  {/* Sentiment from AssemblyAI */}
                  {sentimentSummary && sentimentSummary.total > 0 && (
                    <View
                      className="p-4 rounded-lg mb-4"
                      style={{ backgroundColor: "#011627" }}
                    >
                      <View className="flex-row items-center mb-3">
                        <FaceSmileIcon size={16} color="#8ecae6" />
                        <Text
                          className="ml-2 text-sm"
                          style={{
                            fontFamily: "CabinetGrotesk-Bold",
                            color: "#8ecae6",
                          }}
                        >
                          Sentiment Breakdown
                        </Text>
                      </View>
                      <View className="flex-row gap-3">
                        <View
                          className="flex-1 items-center py-2 rounded-lg"
                          style={{ backgroundColor: "#22c55e20" }}
                        >
                          <Text
                            style={{
                              fontFamily: "CabinetGrotesk-Bold",
                              color: "#22c55e",
                              fontSize: 18,
                            }}
                          >
                            {Math.round(
                              (sentimentSummary.positive /
                                sentimentSummary.total) *
                                100,
                            )}
                            %
                          </Text>
                          <Text
                            className="text-xs"
                            style={{
                              fontFamily: "CabinetGrotesk-Light",
                              color: "#22c55e",
                            }}
                          >
                            Positive
                          </Text>
                        </View>
                        <View
                          className="flex-1 items-center py-2 rounded-lg"
                          style={{ backgroundColor: "#8ecae620" }}
                        >
                          <Text
                            style={{
                              fontFamily: "CabinetGrotesk-Bold",
                              color: "#8ecae6",
                              fontSize: 18,
                            }}
                          >
                            {Math.round(
                              (sentimentSummary.neutral /
                                sentimentSummary.total) *
                                100,
                            )}
                            %
                          </Text>
                          <Text
                            className="text-xs"
                            style={{
                              fontFamily: "CabinetGrotesk-Light",
                              color: "#8ecae6",
                            }}
                          >
                            Neutral
                          </Text>
                        </View>
                        <View
                          className="flex-1 items-center py-2 rounded-lg"
                          style={{ backgroundColor: "#fb850020" }}
                        >
                          <Text
                            style={{
                              fontFamily: "CabinetGrotesk-Bold",
                              color: "#fb8500",
                              fontSize: 18,
                            }}
                          >
                            {Math.round(
                              (sentimentSummary.negative /
                                sentimentSummary.total) *
                                100,
                            )}
                            %
                          </Text>
                          <Text
                            className="text-xs"
                            style={{
                              fontFamily: "CabinetGrotesk-Light",
                              color: "#fb8500",
                            }}
                          >
                            Negative
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Strengths & Improvements - stacked for readability */}
                  <View className="gap-3 mb-4">
                    {/* Strengths */}
                    {aiFeedback.strengths.length > 0 && (
                      <View
                        className="p-4 rounded-xl"
                        style={{
                          backgroundColor: "#ffb70315",
                          borderWidth: 1,
                          borderColor: "#ffb70325",
                        }}
                      >
                        <View className="flex-row items-center mb-3">
                          <View
                            className="w-7 h-7 rounded-full items-center justify-center"
                            style={{ backgroundColor: "#ffb703" }}
                          >
                            <StarIcon size={14} color="#023047" />
                          </View>
                          <Text
                            className="ml-2 text-sm"
                            style={{
                              fontFamily: "CabinetGrotesk-Bold",
                              color: "#ffb703",
                            }}
                          >
                            What You Did Well
                          </Text>
                        </View>
                        {aiFeedback.strengths.map((s, i) => (
                          <View key={i} className="flex-row items-start mb-2">
                            <Text
                              className="text-sm mr-2"
                              style={{
                                fontFamily: "CabinetGrotesk-Bold",
                                color: "#ffb703",
                              }}
                            >
                              {i + 1}.
                            </Text>
                            <Text
                              className="flex-1 text-sm leading-5"
                              style={{
                                fontFamily: "CabinetGrotesk-Regular",
                                color: "#ffffff",
                              }}
                            >
                              {s}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Areas to Improve */}
                    {aiFeedback.improvements.length > 0 && (
                      <View
                        className="p-4 rounded-xl"
                        style={{
                          backgroundColor: "#fb850015",
                          borderWidth: 1,
                          borderColor: "#fb850025",
                        }}
                      >
                        <View className="flex-row items-center mb-3">
                          <View
                            className="w-7 h-7 rounded-full items-center justify-center"
                            style={{ backgroundColor: "#fb8500" }}
                          >
                            <ArrowTrendingUpIcon size={14} color="#ffffff" />
                          </View>
                          <Text
                            className="ml-2 text-sm"
                            style={{
                              fontFamily: "CabinetGrotesk-Bold",
                              color: "#fb8500",
                            }}
                          >
                            Where to Improve
                          </Text>
                        </View>
                        {aiFeedback.improvements.map((s, i) => (
                          <View key={i} className="flex-row items-start mb-2">
                            <Text
                              className="text-sm mr-2"
                              style={{
                                fontFamily: "CabinetGrotesk-Bold",
                                color: "#fb8500",
                              }}
                            >
                              {i + 1}.
                            </Text>
                            <Text
                              className="flex-1 text-sm leading-5"
                              style={{
                                fontFamily: "CabinetGrotesk-Regular",
                                color: "#ffffff",
                              }}
                            >
                              {s}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Action Items */}
                  {aiFeedback.tips.length > 0 && (
                    <View
                      className="mb-4 p-3 rounded-xl"
                      style={{ backgroundColor: "#219ebc10" }}
                    >
                      <View className="flex-row items-center mb-2">
                        <LightBulbIcon size={14} color="#219ebc" />
                        <Text
                          className="ml-1 text-xs"
                          style={{
                            fontFamily: "CabinetGrotesk-Bold",
                            color: "#219ebc",
                          }}
                        >
                          Try Next Time
                        </Text>
                      </View>
                      {aiFeedback.tips.map((s, i) => (
                        <View key={i} className="flex-row items-start mb-1">
                          <Text
                            className="text-xs mr-1"
                            style={{
                              fontFamily: "CabinetGrotesk-Bold",
                              color: "#219ebc",
                            }}
                          >
                            {i + 1}.
                          </Text>
                          <Text
                            className="flex-1 text-xs"
                            style={{
                              fontFamily: "CabinetGrotesk-Light",
                              color: "#8ecae6",
                            }}
                          >
                            {s}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Extended Transcript (for short speeches) */}
                  {aiFeedback.extendedTranscript && (
                    <View
                      className="mt-4 pt-4 border-t"
                      style={{ borderColor: "#034569" }}
                    >
                      <View className="flex-row items-center mb-3">
                        <DocumentTextIcon size={18} color="#22c55e" />
                        <Text
                          className="ml-2"
                          style={{
                            fontFamily: "CabinetGrotesk-Bold",
                            color: "#22c55e",
                          }}
                        >
                          Suggested Extended Version
                        </Text>
                      </View>
                      <View
                        className="p-4 rounded-lg"
                        style={{ backgroundColor: "#22c55e10" }}
                      >
                        <Text
                          className="leading-6"
                          style={{
                            fontFamily: "CabinetGrotesk-Light",
                            color: "#8ecae6",
                          }}
                        >
                          {aiFeedback.extendedTranscript}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Sentence Suggestions */}
                  {aiFeedback.sentenceSuggestions &&
                    aiFeedback.sentenceSuggestions.length > 0 && (
                      <View
                        className="mt-4 pt-4 border-t"
                        style={{ borderColor: "#034569" }}
                      >
                        <View className="flex-row items-center mb-3">
                          <PencilSquareIcon size={18} color="#8ecae6" />
                          <Text
                            className="ml-2"
                            style={{
                              fontFamily: "CabinetGrotesk-Bold",
                              color: "#8ecae6",
                            }}
                          >
                            Better Ways to Say It
                          </Text>
                        </View>
                        {aiFeedback.sentenceSuggestions.map((suggestion, i) => (
                          <View
                            key={i}
                            className="p-4 rounded-lg mb-3"
                            style={{ backgroundColor: "#011627" }}
                          >
                            <View className="flex-row items-center mb-2">
                              <View
                                className="px-2 py-1 rounded"
                                style={{ backgroundColor: "#fb850030" }}
                              >
                                <Text
                                  className="text-xs"
                                  style={{
                                    fontFamily: "CabinetGrotesk-Medium",
                                    color: "#fb8500",
                                  }}
                                >
                                  Original
                                </Text>
                              </View>
                            </View>
                            <Text
                              className="mb-3 italic"
                              style={{
                                fontFamily: "CabinetGrotesk-Light",
                                color: "#6bb8d4",
                              }}
                            >
                              "{suggestion.original}"
                            </Text>
                            <View className="flex-row items-center mb-2">
                              <View
                                className="px-2 py-1 rounded"
                                style={{ backgroundColor: "#ffb703" }}
                              >
                                <Text
                                  className="text-xs"
                                  style={{
                                    fontFamily: "CabinetGrotesk-Medium",
                                    color: "#023047",
                                  }}
                                >
                                  Improved
                                </Text>
                              </View>
                            </View>
                            <Text
                              className="mb-2"
                              style={{
                                fontFamily: "CabinetGrotesk-Medium",
                                color: "#ffffff",
                              }}
                            >
                              "{suggestion.improved}"
                            </Text>
                            <View className="flex-row items-start">
                              <InformationCircleIcon
                                size={14}
                                color="#219ebc"
                              />
                              <Text
                                className="text-xs ml-1 flex-1"
                                style={{
                                  fontFamily: "CabinetGrotesk-Light",
                                  color: "#8ecae6",
                                }}
                              >
                                {suggestion.reason}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                  {/* Filler Words from AI */}
                  {aiFeedback.fillerWords.length > 0 && (
                    <View
                      className="mt-4 pt-4 border-t"
                      style={{ borderColor: "#034569" }}
                    >
                      <FillerWordsDisplay
                        fillerWords={aiFeedback.fillerWords}
                      />
                    </View>
                  )}

                  {/* Vocabulary Boost */}
                  {aiFeedback.vocabularyBoost && (
                    <View
                      className="mt-4 pt-4 border-t"
                      style={{ borderColor: "#034569" }}
                    >
                      <View
                        className="p-4 rounded-xl"
                        style={{ backgroundColor: "#22c55e10" }}
                      >
                        <View className="flex-row items-center mb-2">
                          <BookOpenIcon size={16} color="#22c55e" />
                          <Text
                            className="ml-2 text-sm"
                            style={{
                              fontFamily: "CabinetGrotesk-Bold",
                              color: "#22c55e",
                            }}
                          >
                            Level Up Your Vocab
                          </Text>
                        </View>
                        <Text
                          className="text-lg text-white mb-1"
                          style={{ fontFamily: "CabinetGrotesk-Bold" }}
                        >
                          {aiFeedback.vocabularyBoost.word}
                        </Text>
                        <Text
                          className="text-sm mb-2"
                          style={{
                            fontFamily: "CabinetGrotesk-Light",
                            color: "#8ecae6",
                          }}
                        >
                          {aiFeedback.vocabularyBoost.meaning}
                        </Text>
                        <View
                          className="p-3 rounded-lg"
                          style={{ backgroundColor: "#22c55e08" }}
                        >
                          <Text
                            className="text-sm italic"
                            style={{
                              fontFamily: "CabinetGrotesk-Light",
                              color: "#6bb8d4",
                            }}
                          >
                            "{aiFeedback.vocabularyBoost.useInSentence}"
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {!aiFeedback && !isAnalyzingWithAI && !aiError && (
                <Button
                  title="Get AI Feedback"
                  onPress={handleRetryAI}
                  icon={<SparklesIcon size={20} color="#023047" />}
                />
              )}
            </View>
          )}

          {/* Challenge Score (if applicable) */}
          {session?.practiceMode === "challenge" &&
            session?.challengeScore !== undefined && (
              <View className="bg-background-card rounded-2xl p-5 mb-6 border border-secondary/20">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <TrophyIcon size={24} color="#fb8500" />
                    <Text
                      className="text-lg text-white ml-2"
                      style={{ fontFamily: "CabinetGrotesk-Bold" }}
                    >
                      Challenge Score
                    </Text>
                  </View>
                  <Text
                    className="text-3xl"
                    style={{
                      fontFamily: "CabinetGrotesk-Bold",
                      color: "#fb8500",
                    }}
                  >
                    {session.challengeScore}
                  </Text>
                </View>
                <ProgressBar
                  progress={session.challengeScore}
                  color={
                    session.challengeScore >= 70
                      ? "green"
                      : session.challengeScore >= 40
                        ? "yellow"
                        : "red"
                  }
                  size="medium"
                />
                <Text
                  className="text-sm mt-2"
                  style={{
                    fontFamily: "CabinetGrotesk-Light",
                    color: "#8ecae6",
                  }}
                >
                  {session.challengeScore >= 70
                    ? "Excellent! You crushed this challenge!"
                    : session.challengeScore >= 40
                      ? "Good effort! Keep practicing to improve."
                      : "Keep trying! Practice makes perfect."}
                </Text>
              </View>
            )}

          {/* Metrics section - only show for non-practice mode (practice already shows stats in bento grid) */}
          {session?.practiceMode !== "free" && (
            <View className="mt-6">
              <View className="flex-row items-center mb-3">
                <View
                  className="w-1 h-5 rounded-full mr-2"
                  style={{ backgroundColor: "#219ebc" }}
                />
                <Text
                  className="text-lg text-white"
                  style={{ fontFamily: "CabinetGrotesk-Bold" }}
                >
                  Metrics
                </Text>
              </View>

              {/* Speaking Rate */}
              <MetricsCard
                title="Speaking Rate"
                value={`${displayAnalysis.speakingRate.wordsPerMinute} WPM`}
                subtitle={`Ideal: ${SPEAKING_RATE_CONFIG.IDEAL_MIN}-${SPEAKING_RATE_CONFIG.IDEAL_MAX} WPM`}
                progress={Math.min(
                  100,
                  (displayAnalysis.speakingRate.wordsPerMinute / 180) * 100,
                )}
                progressColor={
                  displayAnalysis.speakingRate.wordsPerMinute >=
                    SPEAKING_RATE_CONFIG.IDEAL_MIN &&
                  displayAnalysis.speakingRate.wordsPerMinute <=
                    SPEAKING_RATE_CONFIG.IDEAL_MAX
                    ? "green"
                    : "yellow"
                }
              />

              {/* Filler Words */}
              <MetricsCard
                title="Filler Words"
                value={getTotalFillerCount(
                  displayAnalysis.fillerWords,
                ).toString()}
                subtitle={
                  displayAnalysis.fillerWords.length > 0
                    ? `Most common: ${displayAnalysis.fillerWords
                        .slice(0, 2)
                        .map((f) => `"${f.word}"`)
                        .join(", ")}`
                    : "No filler words detected!"
                }
                progressColor={
                  getTotalFillerCount(displayAnalysis.fillerWords) <= 3
                    ? "green"
                    : getTotalFillerCount(displayAnalysis.fillerWords) <= 10
                      ? "yellow"
                      : "red"
                }
              />

              {/* Pauses */}
              <MetricsCard
                title="Long Pauses (>1s)"
                value={displayAnalysis.pauseStats.count.toString()}
                subtitle={
                  displayAnalysis.pauseStats.count > 0
                    ? `Avg duration: ${(displayAnalysis.pauseStats.averageDuration / 1000).toFixed(1)}s`
                    : "Great flow!"
                }
                progressColor={
                  displayAnalysis.pauseStats.count <= 3
                    ? "green"
                    : displayAnalysis.pauseStats.count <= 8
                      ? "yellow"
                      : "red"
                }
              />

              {/* Total Words */}
              <MetricsCard
                title="Total Words"
                value={displayAnalysis.speakingRate.totalWords.toString()}
                subtitle={`Content words: ${displayAnalysis.speakingRate.contentWords}`}
              />
            </View>
          )}

          {/* Transcript section with annotation */}
          <View className="mt-6">
            <View className="flex-row items-center mb-3">
              <View
                className="w-1 h-5 rounded-full mr-2"
                style={{ backgroundColor: "#8ecae6" }}
              />
              <Text
                className="text-lg text-white"
                style={{ fontFamily: "CabinetGrotesk-Bold" }}
              >
                Transcript
              </Text>
            </View>
            <TranscriptView
              text={displayTranscription.text}
              fillerWords={displayAnalysis.fillerWords}
              maxHeight={300}
            />
          </View>

          {/* Actions */}
          <View className="mt-6 gap-3">
            <Button
              title="Record Again"
              onPress={() => router.push("/(tabs)/record")}
              size="large"
              icon={<MicrophoneIcon size={20} color="#023047" />}
            />
          </View>
        </View>
      </ScrollView>

      {/* Score Detail Modal - shows all breakdowns */}
      <ScoreDetailModal
        visible={showScoreDetail}
        onClose={() => setShowScoreDetail(false)}
        breakdowns={aiFeedback?.scoreBreakdown || []}
        highlightCategory={highlightCategory}
      />
    </SafeAreaView>
  );
}
