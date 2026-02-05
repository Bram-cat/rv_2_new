import { View, Text, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTranscription } from "../../src/hooks/useTranscription";
import { useSpeechAnalysis, analyzeSpeech } from "../../src/hooks/useSpeechAnalysis";
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
import { analyzeSpeechWithAI, SpeechFeedback, isOpenAIConfigured } from "../../src/services/openai/analyze";
import { calculateChallengeScore, getChallengeById } from "../../src/constants/challenges";

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
  const analysis = useSpeechAnalysis(transcription || session?.transcription || null);

  // Run AI analysis when transcription is available
  const runAIAnalysis = useCallback(async (text: string, durationSec: number) => {
    if (!isOpenAIConfigured()) {
      setAiError("OpenAI not configured. Add EXPO_PUBLIC_OPENAI_API_KEY to .env");
      return;
    }

    setIsAnalyzingWithAI(true);
    setAiError(null);

    try {
      const feedback = await analyzeSpeechWithAI(text, durationSec);
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
                actualValue = (feedback.fillerWordCount || 0) / Math.max(text.split(/\s+/).length, 1);
                break;
              case "clarity":
                actualValue = feedback.clarity || 0;
                break;
              case "paceVariance":
                // Use pace score as proxy (higher is better, so invert)
                actualValue = 10 - (feedback.pace || 5);
                break;
            }
            const challengeScore = calculateChallengeScore(session.challengeType, actualValue);
            updates.challengeScore = challengeScore;
          }
        }

        await updateSession(id, updates);
        setSession((prev) => prev ? { ...prev, ...updates } : null);
      }
    } catch (error) {
      console.error("AI Analysis error:", error);
      setAiError(error instanceof Error ? error.message : "AI analysis failed");
    } finally {
      setIsAnalyzingWithAI(false);
    }
  }, [id, session, updateSession]);

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
              prev ? { ...prev, analysis: computedAnalysis } : null
            );
          }
          // Also run AI analysis if no existing feedback
          if (!loaded.aiFeedback) {
            runAIAnalysis(loaded.transcription.text, loaded.duration / 1000);
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
          "Please add your AssemblyAI API key to the .env file to enable speech-to-text."
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
            : null
        );

        // Run AI analysis
        const durationSec = durationMs / 1000;
        runAIAnalysis(result.text, durationSec);
      }
    },
    [id, isConfigured, transcribe, updateSession, runAIAnalysis]
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
      runAIAnalysis(displayTranscription.text, session.duration / 1000);
    }
  }, [transcription, session, runAIAnalysis]);

  // Loading state
  if (isLoadingSession) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center">
          <View className="bg-primary w-20 h-20 rounded-full items-center justify-center mb-6">
            <Ionicons name="document-text-outline" size={40} color="#ffffff" />
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
          <View className="bg-accent-light w-20 h-20 rounded-full items-center justify-center mb-4">
            <Ionicons name="alert-circle-outline" size={40} color="#e29578" />
          </View>
          <Text
            className="text-xl text-primary-dark mb-2"
            style={{ fontFamily: "Satoshi-Bold" }}
          >
            Session Not Found
          </Text>
          <Text
            className="text-secondary-dark text-center mb-6"
            style={{ fontFamily: "Satoshi-Regular" }}
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
          <View className="bg-secondary w-20 h-20 rounded-full items-center justify-center mb-6">
            <Ionicons name="mic-outline" size={40} color="#ffffff" />
          </View>
          <LoadingSpinner
            message={
              progress === "uploading"
                ? "Uploading audio..."
                : "Transcribing your speech..."
            }
          />
          <Text
            className="text-secondary-dark text-sm mt-4 text-center"
            style={{ fontFamily: "Satoshi-Regular" }}
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
          <View className="bg-accent-light w-20 h-20 rounded-full items-center justify-center mb-4">
            <Ionicons name="sad-outline" size={40} color="#e29578" />
          </View>
          <Text
            className="text-xl text-primary-dark mb-2"
            style={{ fontFamily: "Satoshi-Bold" }}
          >
            Analysis Failed
          </Text>
          <Text
            className="text-secondary-dark text-center mb-6"
            style={{ fontFamily: "Satoshi-Regular" }}
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
          <View className="bg-secondary-light w-20 h-20 rounded-full items-center justify-center mb-4">
            <Ionicons name="analytics-outline" size={40} color="#006d77" />
          </View>
          <Text
            className="text-xl text-primary-dark mb-2"
            style={{ fontFamily: "Satoshi-Bold" }}
          >
            No Analysis Available
          </Text>
          <Text
            className="text-secondary-dark text-center mb-6"
            style={{ fontFamily: "Satoshi-Regular" }}
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
          <View className="bg-background-card rounded-2xl p-5 mb-6 border border-secondary">
            <View className="flex-row items-center mb-4">
              <View className="bg-primary w-10 h-10 rounded-full items-center justify-center">
                <Ionicons name="sparkles" size={20} color="#ffffff" />
              </View>
              <Text
                className="text-lg text-primary-dark ml-3"
                style={{ fontFamily: "Satoshi-Bold" }}
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
              <View className="bg-accent-light p-4 rounded-lg">
                <Text
                  className="text-accent-dark mb-2"
                  style={{ fontFamily: "Satoshi-Regular" }}
                >
                  {aiError}
                </Text>
                <Button title="Retry AI Analysis" onPress={handleRetryAI} variant="secondary" size="small" />
              </View>
            )}

            {aiFeedback && (
              <View>
                {/* AI Score */}
                <View className="flex-row justify-between mb-4 bg-background p-4 rounded-xl">
                  <View className="flex-1 items-center">
                    <Text
                      className="text-3xl text-primary"
                      style={{ fontFamily: "Satoshi-Bold" }}
                    >
                      {aiFeedback.overallScore}/10
                    </Text>
                    <Text className="text-secondary-dark text-xs" style={{ fontFamily: "Satoshi-Regular" }}>Overall</Text>
                  </View>
                  <View className="flex-1 items-center border-l border-secondary-light">
                    <Text className="text-xl text-secondary" style={{ fontFamily: "Satoshi-Bold" }}>{aiFeedback.clarity}/10</Text>
                    <Text className="text-secondary-dark text-xs" style={{ fontFamily: "Satoshi-Regular" }}>Clarity</Text>
                  </View>
                  <View className="flex-1 items-center border-l border-secondary-light">
                    <Text className="text-xl text-secondary" style={{ fontFamily: "Satoshi-Bold" }}>{aiFeedback.pace}/10</Text>
                    <Text className="text-secondary-dark text-xs" style={{ fontFamily: "Satoshi-Regular" }}>Pace</Text>
                  </View>
                  <View className="flex-1 items-center border-l border-secondary-light">
                    <Text className="text-xl text-accent" style={{ fontFamily: "Satoshi-Bold" }}>{aiFeedback.confidence}/10</Text>
                    <Text className="text-secondary-dark text-xs" style={{ fontFamily: "Satoshi-Regular" }}>Confidence</Text>
                  </View>
                </View>

                {/* Summary */}
                <View className="bg-secondary-light p-4 rounded-lg mb-4">
                  <Text className="text-primary-dark leading-5" style={{ fontFamily: "Satoshi-Regular" }}>
                    {aiFeedback.summary}
                  </Text>
                </View>

                {/* Strengths */}
                {aiFeedback.strengths.length > 0 && (
                  <View className="mb-4">
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="star" size={18} color="#006d77" />
                      <Text className="text-primary-dark ml-2" style={{ fontFamily: "Satoshi-Bold" }}>Strengths</Text>
                    </View>
                    {aiFeedback.strengths.map((s, i) => (
                      <View key={i} className="flex-row items-start ml-2 mb-1">
                        <View className="w-2 h-2 rounded-full bg-primary mt-2 mr-2" />
                        <Text className="text-primary-dark flex-1" style={{ fontFamily: "Satoshi-Regular" }}>{s}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Areas to Improve */}
                {aiFeedback.improvements.length > 0 && (
                  <View className="mb-4">
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="trending-up" size={18} color="#e29578" />
                      <Text className="text-accent ml-2" style={{ fontFamily: "Satoshi-Bold" }}>Areas to Improve</Text>
                    </View>
                    {aiFeedback.improvements.map((s, i) => (
                      <View key={i} className="flex-row items-start ml-2 mb-1">
                        <View className="w-2 h-2 rounded-full bg-accent mt-2 mr-2" />
                        <Text className="text-primary-dark flex-1" style={{ fontFamily: "Satoshi-Regular" }}>{s}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Tips */}
                {aiFeedback.tips.length > 0 && (
                  <View className="mb-4">
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="bulb" size={18} color="#83c5be" />
                      <Text className="text-secondary ml-2" style={{ fontFamily: "Satoshi-Bold" }}>Tips for Next Time</Text>
                    </View>
                    {aiFeedback.tips.map((s, i) => (
                      <View key={i} className="flex-row items-start ml-2 mb-1">
                        <View className="w-2 h-2 rounded-full bg-secondary mt-2 mr-2" />
                        <Text className="text-primary-dark flex-1" style={{ fontFamily: "Satoshi-Regular" }}>{s}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Sentence Suggestions */}
                {aiFeedback.sentenceSuggestions && aiFeedback.sentenceSuggestions.length > 0 && (
                  <View className="mt-4 pt-4 border-t border-secondary-light">
                    <View className="flex-row items-center mb-3">
                      <Ionicons name="create" size={18} color="#006d77" />
                      <Text className="text-primary-dark ml-2" style={{ fontFamily: "Satoshi-Bold" }}>
                        Better Ways to Say It
                      </Text>
                    </View>
                    {aiFeedback.sentenceSuggestions.map((suggestion, i) => (
                      <View key={i} className="bg-background p-4 rounded-lg mb-3">
                        <View className="flex-row items-center mb-2">
                          <View className="bg-accent-light px-2 py-1 rounded">
                            <Text className="text-accent-dark text-xs" style={{ fontFamily: "Satoshi-Medium" }}>Original</Text>
                          </View>
                        </View>
                        <Text className="text-secondary-dark mb-3 italic" style={{ fontFamily: "Satoshi-Regular" }}>
                          "{suggestion.original}"
                        </Text>
                        <View className="flex-row items-center mb-2">
                          <View className="bg-primary px-2 py-1 rounded">
                            <Text className="text-white text-xs" style={{ fontFamily: "Satoshi-Medium" }}>Improved</Text>
                          </View>
                        </View>
                        <Text className="text-primary-dark mb-2" style={{ fontFamily: "Satoshi-Medium" }}>
                          "{suggestion.improved}"
                        </Text>
                        <View className="flex-row items-start">
                          <Ionicons name="information-circle" size={14} color="#83c5be" />
                          <Text className="text-secondary-dark text-xs ml-1 flex-1" style={{ fontFamily: "Satoshi-Regular" }}>
                            {suggestion.reason}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Filler Words from AI */}
                {aiFeedback.fillerWords.length > 0 && (
                  <View className="mt-4 pt-4 border-t border-secondary-light">
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="chatbubble-ellipses" size={18} color="#e29578" />
                      <Text className="text-accent ml-2" style={{ fontFamily: "Satoshi-Bold" }}>
                        Filler Words: {aiFeedback.fillerWordCount}
                      </Text>
                    </View>
                    <View className="flex-row flex-wrap">
                      {aiFeedback.fillerWords.map((w, i) => (
                        <View key={i} className="bg-accent-light px-3 py-1 rounded-full mr-2 mb-2">
                          <Text className="text-accent-dark text-sm" style={{ fontFamily: "Satoshi-Medium" }}>{w}</Text>
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
                icon={<Ionicons name="sparkles-outline" size={20} color="#ffffff" />}
              />
            )}
          </View>

          {/* Challenge Score (if applicable) */}
          {session?.practiceMode === "challenge" && session?.challengeScore !== undefined && (
            <View className="bg-background-card rounded-2xl p-5 mb-6 border border-secondary">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Ionicons name="trophy" size={24} color="#e29578" />
                  <Text className="text-lg text-primary-dark ml-2" style={{ fontFamily: "Satoshi-Bold" }}>
                    Challenge Score
                  </Text>
                </View>
                <Text className="text-3xl text-accent" style={{ fontFamily: "Satoshi-Bold" }}>
                  {session.challengeScore}
                </Text>
              </View>
              <ProgressBar
                progress={session.challengeScore}
                color={session.challengeScore >= 70 ? "green" : session.challengeScore >= 40 ? "yellow" : "red"}
                size="medium"
              />
              <Text className="text-secondary-dark text-sm mt-2" style={{ fontFamily: "Satoshi-Regular" }}>
                {session.challengeScore >= 70 ? "Excellent! You crushed this challenge!" :
                 session.challengeScore >= 40 ? "Good effort! Keep practicing to improve." :
                 "Keep trying! Practice makes perfect."}
              </Text>
            </View>
          )}

          {/* Metrics section */}
          <View className="mt-6">
            <Text className="text-lg text-primary-dark mb-3" style={{ fontFamily: "Satoshi-Bold" }}>
              Detailed Metrics
            </Text>

            {/* Speaking Rate */}
            <MetricsCard
              title="Speaking Rate"
              value={`${displayAnalysis.speakingRate.wordsPerMinute} WPM`}
              subtitle={`Ideal: ${SPEAKING_RATE_CONFIG.IDEAL_MIN}-${SPEAKING_RATE_CONFIG.IDEAL_MAX} WPM`}
              progress={Math.min(
                100,
                (displayAnalysis.speakingRate.wordsPerMinute / 180) * 100
              )}
              progressColor={
                displayAnalysis.speakingRate.wordsPerMinute >= SPEAKING_RATE_CONFIG.IDEAL_MIN &&
                displayAnalysis.speakingRate.wordsPerMinute <= SPEAKING_RATE_CONFIG.IDEAL_MAX
                  ? "green"
                  : "yellow"
              }
            />

            {/* Filler Words */}
            <MetricsCard
              title="Filler Words"
              value={getTotalFillerCount(displayAnalysis.fillerWords).toString()}
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
            <Text className="text-lg text-primary-dark mb-3" style={{ fontFamily: "Satoshi-Bold" }}>
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
              icon={<Ionicons name="mic-outline" size={20} color="#ffffff" />}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
