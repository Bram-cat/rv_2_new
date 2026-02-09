import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeftIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowPathIcon,
  MicrophoneIcon,
} from "react-native-heroicons/outline";
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
          <MicrophoneIcon size={64} color="#fb8500" />
          <Text
            className="text-xl text-white mt-4 text-center"
            style={{ fontFamily: "CabinetGrotesk-Bold" }}
          >
            Microphone Access Required
          </Text>
          <Text
            className="text-center mt-2"
            style={{ fontFamily: "CabinetGrotesk-Light", color: "#8ecae6" }}
          >
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
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 p-2 rounded-full"
            style={{ backgroundColor: "#219ebc20" }}
            activeOpacity={0.7}
          >
            <ArrowLeftIcon size={20} color="#8ecae6" />
          </TouchableOpacity>
          <View>
            <Text
              className="text-2xl text-white"
              style={{ fontFamily: "CabinetGrotesk-Bold" }}
            >
              Free Practice
            </Text>
            <Text
              style={{ fontFamily: "CabinetGrotesk-Light", color: "#8ecae6" }}
            >
              Record with AI feedback
            </Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 items-center justify-center px-6">
        {/* Timer */}
        <View className="mb-8">
          <Timer durationMs={duration} showRemaining={false} />
        </View>

        {/* Status indicator */}
        {isRecording && (
          <View
            className="mb-6 flex-row items-center px-4 py-2 rounded-full"
            style={{
              backgroundColor: isPaused ? "#fb850030" : "#ffb70330",
            }}
          >
            {isPaused ? (
              <PauseIcon size={18} color="#fb8500" />
            ) : (
              <View
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#ffb703" }}
              />
            )}
            <Text
              className="text-sm ml-2"
              style={{
                fontFamily: "CabinetGrotesk-Medium",
                color: isPaused ? "#fb8500" : "#ffb703",
              }}
            >
              {isPaused ? "Paused" : "Recording..."}
            </Text>
          </View>
        )}

        {/* Record Button */}
        <RecordButton
          isRecording={isRecording}
          onPress={isRecording ? handleStopAndAnalyze : handleStartRecording}
        />

        {/* Recording Controls */}
        {isRecording && (
          <View className="flex-row items-center mt-10 gap-8">
            <TouchableOpacity
              onPress={handlePauseResume}
              className="items-center"
              activeOpacity={0.7}
            >
              <View
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{
                  backgroundColor: "#219ebc",
                  shadowColor: "#219ebc",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                {isPaused ? (
                  <PlayIcon size={26} color="#ffffff" strokeWidth={2} />
                ) : (
                  <PauseIcon size={26} color="#ffffff" strokeWidth={2} />
                )}
              </View>
              <Text
                className="text-xs mt-2"
                style={{
                  fontFamily: "CabinetGrotesk-Medium",
                  color: "#8ecae6",
                }}
              >
                {isPaused ? "Resume" : "Pause"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleStopAndAnalyze}
              className="items-center"
              activeOpacity={0.7}
            >
              <View
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{
                  backgroundColor: "#ffb703",
                  shadowColor: "#ffb703",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <StopIcon size={26} color="#023047" strokeWidth={2} />
              </View>
              <Text
                className="text-xs mt-2"
                style={{
                  fontFamily: "CabinetGrotesk-Medium",
                  color: "#8ecae6",
                }}
              >
                Save
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={resetRecording}
              className="items-center"
              activeOpacity={0.7}
            >
              <View
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{
                  backgroundColor: "#fb8500",
                  shadowColor: "#fb8500",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <ArrowPathIcon size={26} color="#ffffff" strokeWidth={2} />
              </View>
              <Text
                className="text-xs mt-2"
                style={{
                  fontFamily: "CabinetGrotesk-Medium",
                  color: "#8ecae6",
                }}
              >
                Reset
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Status Text */}
        <Text
          className="mt-6 text-center"
          style={{ fontFamily: "CabinetGrotesk-Light", color: "#8ecae6" }}
        >
          {isRecording
            ? isPaused
              ? "Paused — tap play to continue"
              : "Speak naturally, stop when done"
            : "Tap to start recording"}
        </Text>
      </View>
    </SafeAreaView>
  );
}
