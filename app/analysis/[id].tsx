import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
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
} from "react-native-heroicons/outline";

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

import { SPEAKING_RATE_CONFIG } from "../../src/constants/thresholds";
import { getTotalFillerCount } from "../../src/analysis/fillerWords";
import {
  analyzeSpeechWithAI,
  SpeechFeedback,
  ScoreBreakdown,
  isOpenAIConfigured,
} from "../../src/services/openai/analyze";
import {
  calculateChallengeScore,
  getChallengeById,
} from "../../src/constants/challenges";

// Score detail modal component
function ScoreDetailModal({
  visible,
  onClose,
  breakdown,
}: {
  visible: boolean;
  onClose: () => void;
  breakdown: ScoreBreakdown | null;
}) {
  if (!breakdown) return null;

  const scoreColor =
    breakdown.currentScore >= 8
      ? "#22c55e"
      : breakdown.currentScore >= 5
        ? "#ffb703"
        : "#fb8500";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-primary rounded-t-3xl p-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text
              className="text-xl text-white"
              style={{ fontFamily: "CabinetGrotesk-Bold" }}
            >
              {breakdown.category}
            </Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <XMarkIcon size={24} color="#8ecae6" />
            </TouchableOpacity>
          </View>

          {/* Score display */}
          <View
            className="items-center py-6 rounded-xl mb-4"
            style={{ backgroundColor: "#011627" }}
          >
            <Text
              className="text-5xl"
              style={{ fontFamily: "CabinetGrotesk-Bold", color: scoreColor }}
            >
              {breakdown.currentScore}/{breakdown.maxScore}
            </Text>
          </View>

          {/* What to improve */}
          <View className="mb-4">
            <View className="flex-row items-center mb-2">
              <ArrowTrendingUpIcon size={18} color="#fb8500" />
              <Text
                className="ml-2"
                style={{ fontFamily: "CabinetGrotesk-Bold", color: "#fb8500" }}
              >
                What's holding you back
              </Text>
            </View>
            <View
              className="p-4 rounded-lg"
              style={{ backgroundColor: "#fb850015" }}
            >
              <Text
                className="leading-5"
                style={{ fontFamily: "CabinetGrotesk-Light", color: "#8ecae6" }}
              >
                {breakdown.whatToImprove}
              </Text>
            </View>
          </View>

          {/* How to get full marks */}
          <View className="mb-6">
            <View className="flex-row items-center mb-2">
              <CheckCircleIcon size={18} color="#22c55e" />
              <Text
                className="ml-2"
                style={{ fontFamily: "CabinetGrotesk-Bold", color: "#22c55e" }}
              >
                How to get 10/10
              </Text>
            </View>
            <View
              className="p-4 rounded-lg"
              style={{ backgroundColor: "#22c55e15" }}
            >
              <Text
                className="leading-5"
                style={{ fontFamily: "CabinetGrotesk-Light", color: "#8ecae6" }}
              >
                {breakdown.howToGetFullMarks}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onClose}
            className="py-4 items-center rounded-xl"
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

  // State
  const [session, setSession] = useState<RecordingSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // AI Analysis State
  const [aiFeedback, setAiFeedback] = useState<SpeechFeedback | null>(null);
  const [isAnalyzingWithAI, setIsAnalyzingWithAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Score detail modal
  const [selectedBreakdown, setSelectedBreakdown] =
    useState<ScoreBreakdown | null>(null);
  const [showScoreDetail, setShowScoreDetail] = useState(false);

  // Hooks
  const {
    result: transcription,
    isLoading: isTranscribing,
    error: transcriptionError,
    progress,
    isConfigured,
    transcribe,
  } = useTranscription();

  const { updateSession } = useStorage();

  // Compute analysis from transcription
  const analysis = useSpeechAnalysis(
    transcription || session?.transcription || null,
  );

  // Run AI analysis when transcription is available
  const runAIAnalysis = useCallback(
    async (
      text: string,
      durationSec: number,
      sentimentData?: any[],
      speechCtx?: any,
    ) => {
      if (!isOpenAIConfigured()) {
        setAiError(
          "OpenAI not configured. Add EXPO_PUBLIC_OPENAI_API_KEY to .env",
        );
        return;
      }

      setIsAnalyzingWithAI(true);
      setAiError(null);

      try {
        const feedback = await analyzeSpeechWithAI(
          text,
          durationSec,
          sentimentData,
          speechCtx,
        );
        setAiFeedback(feedback);

        // Save AI feedback to session
        if (id) {
          const updates: Partial<RecordingSession> = { aiFeedback: feedback };

          // If this is a challenge session, calculate the challenge score
          if (session?.practiceMode === "challenge" && session?.challengeType) {
            const challenge = getChallengeById(session.challengeType);
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
                session.challengeType,
                actualValue,
              );
              updates.challengeScore = challengeScore;
            }
          }

          await updateSession(id, updates);
          setSession((prev) => (prev ? { ...prev, ...updates } : null));
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
    [id, session, updateSession],
  );

  // Load session on mount
  useEffect(() => {
    async function loadSession() {
      if (!id) return;

      setIsLoadingSession(true);
      try {
        const loaded = await getSession(id);
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
              sentimentData,
              speechCtx,
            );
          }
        }

        // If no transcription yet and we have an audio file, start transcribing
        if (loaded && !loaded.transcription && loaded.audioUri) {
          startTranscription(loaded.audioUri, loaded.duration);
        }
      } catch (error) {
        console.error("Error loading session:", error);
      } finally {
        setIsLoadingSession(false);
      }
    }

    loadSession();
  }, [id]);

  // Start transcription
  const startTranscription = useCallback(
    async (audioUri: string, durationMs: number) => {
      if (!isConfigured) {
        Alert.alert(
          "Configuration Required",
          "Please add your AssemblyAI API key to the .env file to enable speech-to-text.",
        );
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
        const speechCtx = session ? (session as any).speechContext : undefined;
        runAIAnalysis(result.text, durationSec, sentimentData, speechCtx);
      }
    },
    [id, isConfigured, transcribe, updateSession, runAIAnalysis, session],
  );

  // Retry transcription
  const handleRetry = useCallback(() => {
    if (session?.audioUri) {
      startTranscription(session.audioUri, session.duration);
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
        sentimentData,
        speechCtx,
      );
    }
  }, [transcription, session, runAIAnalysis]);

  // Handle score tap
  const handleScoreTap = (category: string) => {
    if (aiFeedback?.scoreBreakdown) {
      const breakdown = aiFeedback.scoreBreakdown.find(
        (b) => b.category === category,
      );
      if (breakdown) {
        setSelectedBreakdown(breakdown);
        setShowScoreDetail(true);
      }
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
          {/* AI Coach Feedback Section */}
          <View className="bg-background-card rounded-2xl p-5 mb-6 border border-secondary/20">
            <View className="flex-row items-center mb-4">
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: "#ffb703" }}
              >
                <SparklesIcon size={20} color="#023047" />
              </View>
              <Text
                className="text-lg text-white ml-3"
                style={{ fontFamily: "CabinetGrotesk-Bold" }}
              >
                AI Coach Feedback
              </Text>
            </View>

            {isAnalyzingWithAI && (
              <View className="items-center py-4">
                <LoadingSpinner message="Getting AI feedback..." />
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
                {/* AI Score - Tappable */}
                <View
                  className="flex-row justify-between mb-4 p-4 rounded-xl"
                  style={{ backgroundColor: "#011627" }}
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
                  <TouchableOpacity
                    className="flex-1 items-center border-l"
                    style={{ borderColor: "#034569" }}
                    onPress={() => handleScoreTap("Clarity")}
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
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 items-center border-l"
                    style={{ borderColor: "#034569" }}
                    onPress={() => handleScoreTap("Pace")}
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
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 items-center border-l"
                    style={{ borderColor: "#034569" }}
                    onPress={() => handleScoreTap("Confidence")}
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
                  </TouchableOpacity>
                </View>

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
                      Tap any score to see how to improve it
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

                {/* Strengths */}
                {aiFeedback.strengths.length > 0 && (
                  <View className="mb-4">
                    <View className="flex-row items-center mb-2">
                      <StarIcon size={18} color="#ffb703" />
                      <Text
                        className="ml-2"
                        style={{
                          fontFamily: "CabinetGrotesk-Bold",
                          color: "#ffb703",
                        }}
                      >
                        Strengths
                      </Text>
                    </View>
                    {aiFeedback.strengths.map((s, i) => (
                      <View key={i} className="flex-row items-start ml-2 mb-1">
                        <View
                          className="w-2 h-2 rounded-full mt-2 mr-2"
                          style={{ backgroundColor: "#ffb703" }}
                        />
                        <Text
                          className="flex-1"
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

                {/* Areas to Improve */}
                {aiFeedback.improvements.length > 0 && (
                  <View className="mb-4">
                    <View className="flex-row items-center mb-2">
                      <ArrowTrendingUpIcon size={18} color="#fb8500" />
                      <Text
                        className="ml-2"
                        style={{
                          fontFamily: "CabinetGrotesk-Bold",
                          color: "#fb8500",
                        }}
                      >
                        Areas to Improve
                      </Text>
                    </View>
                    {aiFeedback.improvements.map((s, i) => (
                      <View key={i} className="flex-row items-start ml-2 mb-1">
                        <View
                          className="w-2 h-2 rounded-full mt-2 mr-2"
                          style={{ backgroundColor: "#fb8500" }}
                        />
                        <Text
                          className="flex-1"
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

                {/* Tips */}
                {aiFeedback.tips.length > 0 && (
                  <View className="mb-4">
                    <View className="flex-row items-center mb-2">
                      <LightBulbIcon size={18} color="#219ebc" />
                      <Text
                        className="ml-2"
                        style={{
                          fontFamily: "CabinetGrotesk-Bold",
                          color: "#219ebc",
                        }}
                      >
                        Tips for Next Time
                      </Text>
                    </View>
                    {aiFeedback.tips.map((s, i) => (
                      <View key={i} className="flex-row items-start ml-2 mb-1">
                        <View
                          className="w-2 h-2 rounded-full mt-2 mr-2"
                          style={{ backgroundColor: "#219ebc" }}
                        />
                        <Text
                          className="flex-1"
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
                            <InformationCircleIcon size={14} color="#219ebc" />
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
                    <View className="flex-row items-center mb-2">
                      <ChatBubbleLeftEllipsisIcon size={18} color="#fb8500" />
                      <Text
                        className="ml-2"
                        style={{
                          fontFamily: "CabinetGrotesk-Bold",
                          color: "#fb8500",
                        }}
                      >
                        Filler Words: {aiFeedback.fillerWordCount}
                      </Text>
                    </View>
                    <View className="flex-row flex-wrap">
                      {aiFeedback.fillerWords.map((w, i) => (
                        <View
                          key={i}
                          className="px-3 py-1 rounded-full mr-2 mb-2"
                          style={{ backgroundColor: "#fb850030" }}
                        >
                          <Text
                            className="text-sm"
                            style={{
                              fontFamily: "CabinetGrotesk-Medium",
                              color: "#fb8500",
                            }}
                          >
                            {w}
                          </Text>
                        </View>
                      ))}
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

          {/* Metrics section */}
          <View className="mt-6">
            <Text
              className="text-lg text-white mb-3"
              style={{ fontFamily: "CabinetGrotesk-Bold" }}
            >
              Detailed Metrics
            </Text>

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

          {/* Transcript section */}
          <View className="mt-6">
            <Text
              className="text-lg text-white mb-3"
              style={{ fontFamily: "CabinetGrotesk-Bold" }}
            >
              Transcript
            </Text>
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

      {/* Score Detail Modal */}
      <ScoreDetailModal
        visible={showScoreDetail}
        onClose={() => setShowScoreDetail(false)}
        breakdown={selectedBreakdown}
      />
    </SafeAreaView>
  );
}
