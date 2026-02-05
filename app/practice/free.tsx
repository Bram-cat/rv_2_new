import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";

import { usePermissions } from "../../src/hooks/usePermissions";
import { useAudioRecording } from "../../src/hooks/useAudioRecording";
import { useStorage } from "../../src/hooks/useStorage";
import { RecordButton } from "../../src/components/recording/RecordButton";
import { Timer } from "../../src/components/recording/Timer";
import { LoadingSpinner } from "../../src/components/ui/LoadingSpinner";

export default function FreePracticeScreen() {
  const router = useRouter();
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

  const handleStartRecording = async () => {
    await startRecording();
  };

  const handleStopAndAnalyze = async () => {
    const audioUri = await stopRecording();
    if (audioUri) {
      const sessionId = Crypto.randomUUID();
      await addSession({
        id: sessionId,
        createdAt: new Date().toISOString(),
        audioUri,
        duration,
        transcription: null,
        analysis: null,
        aiFeedback: null,
        practiceMode: "free",
        title: "Free Practice",
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
          <Text className="text-secondary-dark text-center mt-2">
            Please enable microphone access in settings to record your practice
            sessions.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Header */}
      <View className="px-6 pt-6 pb-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#006d77" />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-bold text-primary-dark">
              Free Practice
            </Text>
            <Text className="text-secondary-dark">
              Unlimited recording with AI feedback
            </Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 items-center justify-center px-6">
        {/* Timer */}
        <View className="mb-8">
          <Timer duration={duration} maxDuration={300000} showWarning={false} />
        </View>

        {/* Tips when not recording */}
        {!isRecording && (
          <View className="bg-primary-light rounded-2xl p-5 mb-8 w-full">
            <Text className="text-sm font-semibold text-primary-dark mb-3">
              Quick Tips
            </Text>
            <View className="flex-row items-start mb-2">
              <Ionicons name="checkmark-circle" size={16} color="#006d77" />
              <Text className="text-sm text-primary-dark ml-2 flex-1">
                Speak naturally, as if presenting to a real audience
              </Text>
            </View>
            <View className="flex-row items-start mb-2">
              <Ionicons name="checkmark-circle" size={16} color="#006d77" />
              <Text className="text-sm text-primary-dark ml-2 flex-1">
                Try to minimize filler words like "um" and "uh"
              </Text>
            </View>
            <View className="flex-row items-start">
              <Ionicons name="checkmark-circle" size={16} color="#006d77" />
              <Text className="text-sm text-primary-dark ml-2 flex-1">
                Aim for 120-160 words per minute
              </Text>
            </View>
          </View>
        )}

        {/* Record Button */}
        <RecordButton
          isRecording={isRecording}
          isPaused={isPaused}
          onPress={isRecording ? handleStopAndAnalyze : handleStartRecording}
        />

        {/* Recording Controls */}
        {isRecording && (
          <View className="flex-row items-center mt-8 gap-4">
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
              ? "Recording paused - tap play to continue"
              : "Recording... tap the checkmark when done"
            : "Tap to start recording"}
        </Text>
      </View>
    </SafeAreaView>
  );
}
