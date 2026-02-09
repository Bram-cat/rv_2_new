import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import * as Crypto from "expo-crypto";

import { usePermissions } from "../../../src/hooks/usePermissions";
import { useAudioRecording } from "../../../src/hooks/useAudioRecording";
import { useStorage } from "../../../src/hooks/useStorage";
import { RecordButton } from "../../../src/components/recording/RecordButton";
import { Timer } from "../../../src/components/recording/Timer";
import { LoadingSpinner } from "../../../src/components/ui/LoadingSpinner";
import {
  ChallengeDefinition,
  ChallengeDifficulty,
  DIFFICULTY_LABELS,
  getChallengeById,
} from "../../../src/constants/challenges";
import { ChallengeType } from "../../../src/types/recording";

export default function ChallengeRecordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    challengeType: string;
    difficulty: string;
  }>();

  const challengeType = params.challengeType as ChallengeType;
  const difficulty = (params.difficulty || "medium") as ChallengeDifficulty;

  const [challenge, setChallenge] = useState<ChallengeDefinition | null>(null);

  const { hasPermission, isLoading: permissionLoading } = usePermissions();
  const { addSession } = useStorage();

  const {
    isRecording,
    isPaused,
    duration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  } = useAudioRecording();

  useEffect(() => {
    if (challengeType) {
      const c = getChallengeById(challengeType);
      if (c) setChallenge(c);
    }
  }, [challengeType]);

  const targetDuration = challenge
    ? challenge.difficultyLevels[difficulty].duration * 1000
    : 60000;

  const handleStartRecording = async () => {
    await startRecording();
  };

  const handleStopAndAnalyze = async () => {
    const audioUri = await stopRecording();
    if (audioUri && challenge) {
      const sessionId = Crypto.randomUUID();
      await addSession({
        id: sessionId,
        createdAt: new Date().toISOString(),
        audioUri,
        duration,
        transcription: null,
        analysis: null,
        aiFeedback: null,
        practiceMode: "challenge",
        challengeType: challenge.id,
        targetDuration: targetDuration / 1000,
        title: `${challenge.name} - ${DIFFICULTY_LABELS[difficulty]}`,
      });
      router.push(`/analysis/${sessionId}`);
    }
  };

  const handlePauseResume = async () => {
    if (isPaused) {
      await resumeRecording();
    } else {
      await pauseRecording();
    }
  };

  // Auto-stop when target duration is reached
  useEffect(() => {
    if (isRecording && !isPaused && duration >= targetDuration) {
      handleStopAndAnalyze();
    }
  }, [duration, isRecording, isPaused, targetDuration]);

  if (permissionLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <LoadingSpinner message="Checking permissions..." />
      </SafeAreaView>
    );
  }

  if (!hasPermission) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="mic-off-outline" size={64} color="#e29578" />
          <Text className="text-xl font-semibold text-primary-dark mt-4 text-center">
            Microphone Access Required
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!challenge) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <LoadingSpinner message="Loading challenge..." />
      </SafeAreaView>
    );
  }

  const level = challenge.difficultyLevels[difficulty];
  const targetMin = Math.floor(targetDuration / 60000);
  const progress = duration / targetDuration;
  const isNearEnd = progress > 0.8;

  const getTargetDescription = () => {
    switch (challenge.scoringMetric) {
      case "fillerRatio":
        return `Keep filler words below ${level.target * 100}%`;
      case "paceVariance":
        return `Keep pace variance under ${level.target} WPM`;
      case "clarity":
        return `Achieve clarity score of ${level.target}/10`;
      default:
        return "";
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Header */}
      <View className="px-6 pt-6 pb-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#006d77" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-primary-dark">
              {challenge.name}
            </Text>
            <Text className="text-secondary-dark text-sm">
              {DIFFICULTY_LABELS[difficulty]} • {targetMin} min
            </Text>
          </View>
          <View
            style={{ backgroundColor: challenge.color + "20" }}
            className="px-3 py-1 rounded-full"
          >
            <Text
              style={{ color: challenge.color }}
              className="text-sm font-medium"
            >
              Challenge
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        {/* Challenge Goal */}
        <View
          style={{ backgroundColor: challenge.color + "15" }}
          className="rounded-2xl p-4 mb-6"
        >
          <View className="flex-row items-center">
            <Ionicons name="trophy-outline" size={20} color={challenge.color} />
            <Text
              style={{ color: challenge.color }}
              className="text-sm font-semibold ml-2"
            >
              Challenge Goal
            </Text>
          </View>
          <Text className="text-primary-dark mt-2 font-medium">
            {getTargetDescription()}
          </Text>
        </View>

        {/* Timer */}
        <View className="items-center mb-8">
          <Timer
            durationMs={duration}
            maxDurationMs={targetDuration}
            showRemaining={isNearEnd}
          />
          <Text
            className={`text-sm mt-2 ${
              isNearEnd ? "text-accent" : "text-secondary-dark"
            }`}
          >
            {isNearEnd ? "Almost there!" : `${targetMin} minute challenge`}
          </Text>
        </View>

        {/* Tips Panel */}
        {!isRecording && (
          <View className="bg-primary-light rounded-2xl p-5 mb-8">
            <Text className="text-sm font-semibold text-primary-dark mb-3">
              Pro Tips
            </Text>
            {challenge.tips.slice(0, 3).map((tip, index) => (
              <View key={index} className="flex-row items-start mt-2">
                <Ionicons
                  name="bulb-outline"
                  size={16}
                  color={challenge.color}
                />
                <Text className="text-sm text-primary-dark ml-2 flex-1">
                  {tip}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Record Button */}
        <View className="items-center">
          <RecordButton
            isRecording={isRecording}
            onPress={isRecording ? handleStopAndAnalyze : handleStartRecording}
          />
        </View>

        {/* Recording Controls */}
        {isRecording && (
          <View className="flex-row items-center justify-center mt-8 gap-4">
            <TouchableOpacity
              onPress={handlePauseResume}
              className="bg-secondary-light w-14 h-14 rounded-full items-center justify-center"
            >
              <Ionicons
                name={isPaused ? "play" : "pause"}
                size={24}
                color="#006d77"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleStopAndAnalyze}
              className="bg-primary w-14 h-14 rounded-full items-center justify-center"
            >
              <Ionicons name="checkmark" size={24} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={resetRecording}
              className="bg-accent/20 w-14 h-14 rounded-full items-center justify-center"
            >
              <Ionicons name="refresh" size={24} color="#e29578" />
            </TouchableOpacity>
          </View>
        )}

        {/* Status Text */}
        <Text className="text-secondary-dark mt-6 text-center">
          {isRecording
            ? isPaused
              ? "Paused - tap play to continue"
              : "Focus on the challenge goal!"
            : "Tap to start your challenge"}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
