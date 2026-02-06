import { View, Text, ScrollView, Alert, TouchableOpacity } from "react-native";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "expo-router";
import * as Crypto from "expo-crypto";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MicrophoneIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowPathIcon,
  ChartBarIcon,
  LightBulbIcon,
  SparklesIcon,
  PencilSquareIcon,
  ClockIcon,
} from "react-native-heroicons/outline";

import { usePermissions } from "../../src/hooks/usePermissions";
import { useAudioRecording } from "../../src/hooks/useAudioRecording";
import { useStorage } from "../../src/hooks/useStorage";

import { RecordButton } from "../../src/components/recording/RecordButton";
import { Timer } from "../../src/components/recording/Timer";
import { VoiceVisualizer } from "../../src/components/recording/VoiceVisualizer";
import { Button } from "../../src/components/ui/Button";
import { LoadingSpinner } from "../../src/components/ui/LoadingSpinner";
import {
  SpeechContextModal,
  SpeechContext,
} from "../../src/components/modals/SpeechContextModal";

import { RECORDING_CONFIG } from "../../src/constants/thresholds";
import { currentSpeechContext } from "./_layout";

// Generate a unique ID using expo-crypto
function generateId(): string {
  return Crypto.randomUUID();
}

// Format ms to mm:ss
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Control button component with Heroicons
function ControlButton({
  icon: Icon,
  label,
  onPress,
  variant = "default",
  disabled = false,
  size = "medium",
}: {
  icon: React.ComponentType<{
    size: number;
    color: string;
    strokeWidth?: number;
  }>;
  label: string;
  onPress: () => void;
  variant?: "default" | "danger" | "success";
  disabled?: boolean;
  size?: "small" | "medium";
}) {
  const bgColors = {
    default: "#219ebc",
    danger: "#fb8500",
    success: "#ffb703",
  };

  const sizeClasses = {
    small: { width: 64, height: 64 },
    medium: { width: 72, height: 72 },
  };

  const iconSizes = {
    small: 24,
    medium: 28,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className="items-center"
      activeOpacity={0.7}
    >
      <View
        className={`rounded-full items-center justify-center ${disabled ? "opacity-50" : ""}`}
        style={{
          ...sizeClasses[size],
          backgroundColor: bgColors[variant],
          shadowColor: bgColors[variant],
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <Icon
          size={iconSizes[size]}
          color={variant === "success" ? "#023047" : "#ffffff"}
          strokeWidth={2}
        />
      </View>
      <Text
        className="text-xs text-secondary-light mt-2"
        style={{ fontFamily: "CabinetGrotesk-Medium" }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function RecordScreen() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [speechContext, setSpeechContext] = useState<SpeechContext | null>(
    currentSpeechContext,
  );
  const [showEditContext, setShowEditContext] = useState(false);

  // Update context when it changes
  useEffect(() => {
    setSpeechContext(currentSpeechContext);
  }, []);

  // Hooks
  const {
    hasPermission,
    isLoading: permissionLoading,
    requestPermission,
  } = usePermissions();

  const {
    isRecording,
    isPaused,
    duration,
    error: recordingError,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecording();

  const { addSession } = useStorage();

  // Time limit in ms
  const timeLimitMs = speechContext?.timeLimitMinutes
    ? speechContext.timeLimitMinutes * 60 * 1000
    : 0;

  // Auto-stop when time limit reached
  useEffect(() => {
    if (
      timeLimitMs > 0 &&
      isRecording &&
      !isPaused &&
      duration >= timeLimitMs
    ) {
      handleStop();
    }
  }, [duration, timeLimitMs, isRecording, isPaused]);

  // Handle record button press - only starts recording
  const handleRecordPress = useCallback(async () => {
    if (!isRecording) {
      await startRecording();
    }
  }, [isRecording, startRecording]);

  // Handle stop button - directly saves and navigates to analysis
  const handleStop = useCallback(async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const uri = await stopRecording();
      if (uri) {
        // Create a new session with expo-crypto UUID
        const sessionId = generateId();
        const newSession = {
          id: sessionId,
          createdAt: new Date().toISOString(),
          audioUri: uri,
          duration: duration,
          transcription: null,
          analysis: null,
          speechContext: speechContext,
        };

        await addSession(newSession);
        resetRecording();

        // Navigate directly to analysis
        router.push(`/analysis/${sessionId}`);
      }
    } catch (error) {
      console.error("Save recording error:", error);
      Alert.alert(
        "Error",
        `Failed to save recording: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    stopRecording,
    duration,
    addSession,
    router,
    resetRecording,
    isSaving,
    speechContext,
  ]);

  // Handle pause/continue button
  const handlePauseResume = useCallback(() => {
    if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  }, [isPaused, pauseRecording, resumeRecording]);

  // Handle reset button
  const handleReset = useCallback(() => {
    Alert.alert(
      "Reset Recording",
      "Are you sure you want to reset and start over?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            resetRecording();
          },
        },
      ],
    );
  }, [resetRecording]);

  // Handle context edit
  const handleContextUpdate = (context: SpeechContext) => {
    setSpeechContext(context);
    setShowEditContext(false);
  };

  // Loading state
  if (permissionLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <LoadingSpinner message="Checking permissions..." />
      </SafeAreaView>
    );
  }

  // Permission denied state
  if (!hasPermission) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <View className="flex-1 items-center justify-center px-6">
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: "#ffb70330" }}
          >
            <MicrophoneIcon size={48} color="#ffb703" />
          </View>
          <Text
            className="text-xl text-white mb-2 text-center"
            style={{ fontFamily: "CabinetGrotesk-Bold" }}
          >
            Microphone Access Required
          </Text>
          <Text
            className="text-secondary-light text-center mb-6"
            style={{ fontFamily: "CabinetGrotesk-Light" }}
          >
            We need access to your microphone to record your speech for analysis
            and provide feedback.
          </Text>
          <Button title="Grant Permission" onPress={requestPermission} />
        </View>
      </SafeAreaView>
    );
  }

  // Saving state - show loading
  if (isSaving) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <View className="flex-1 items-center justify-center">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: "#ffb703" }}
          >
            <ChartBarIcon size={40} color="#023047" />
          </View>
          <LoadingSpinner message="Analyzing your speech..." />
        </View>
      </SafeAreaView>
    );
  }

  // Remaining time display
  const remainingMs = timeLimitMs > 0 ? Math.max(0, timeLimitMs - duration) : 0;
  const isNearTimeLimit =
    timeLimitMs > 0 && remainingMs < 30000 && remainingMs > 0;

  // Main recording state
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text
            className="text-2xl text-white text-center"
            style={{ fontFamily: "CabinetGrotesk-Bold" }}
          >
            Record Speech
          </Text>
          <Text
            className="text-secondary-light text-center mt-1"
            style={{ fontFamily: "CabinetGrotesk-Light" }}
          >
            {speechContext?.speechType || "Practice your presentation skills"}
          </Text>
        </View>

        {/* Speech Context Display with Edit Button */}
        {speechContext && speechContext.speechType !== "General Practice" && (
          <View className="mx-6 mb-4 bg-background-card rounded-xl p-4 border border-secondary/20">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <SparklesIcon size={16} color="#ffb703" />
                <Text
                  className="text-accent ml-2"
                  style={{ fontFamily: "CabinetGrotesk-Medium" }}
                >
                  Context
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowEditContext(true)}
                className="flex-row items-center px-3 py-1 rounded-full"
                style={{ backgroundColor: "#219ebc30" }}
              >
                <PencilSquareIcon size={14} color="#8ecae6" />
                <Text
                  className="text-xs ml-1"
                  style={{
                    fontFamily: "CabinetGrotesk-Medium",
                    color: "#8ecae6",
                  }}
                >
                  Edit
                </Text>
              </TouchableOpacity>
            </View>
            <Text
              className="text-secondary-light text-sm"
              style={{ fontFamily: "CabinetGrotesk-Light" }}
            >
              {speechContext.audience && `Audience: ${speechContext.audience}`}
              {speechContext.goal && ` • Goal: ${speechContext.goal}`}
            </Text>
            <View className="flex-row flex-wrap gap-1 mt-2">
              {speechContext.focusAreas.map((area, i) => (
                <View
                  key={i}
                  className="px-2 py-1 rounded-full"
                  style={{ backgroundColor: "#219ebc30" }}
                >
                  <Text
                    className="text-xs"
                    style={{
                      fontFamily: "CabinetGrotesk-Medium",
                      color: "#8ecae6",
                    }}
                  >
                    {area}
                  </Text>
                </View>
              ))}
              {speechContext.timeLimitMinutes > 0 && (
                <View
                  className="px-2 py-1 rounded-full flex-row items-center"
                  style={{ backgroundColor: "#ffb70330" }}
                >
                  <ClockIcon size={12} color="#ffb703" />
                  <Text
                    className="text-xs ml-1"
                    style={{
                      fontFamily: "CabinetGrotesk-Medium",
                      color: "#ffb703",
                    }}
                  >
                    {speechContext.timeLimitMinutes} min
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* No context - show edit button */}
        {(!speechContext ||
          speechContext.speechType === "General Practice") && (
          <TouchableOpacity
            onPress={() => setShowEditContext(true)}
            className="mx-6 mb-4 flex-row items-center justify-center py-3 rounded-xl border border-dashed border-secondary/30"
          >
            <PencilSquareIcon size={16} color="#8ecae6" />
            <Text
              className="ml-2"
              style={{
                fontFamily: "CabinetGrotesk-Medium",
                color: "#8ecae6",
              }}
            >
              Set speech preferences
            </Text>
          </TouchableOpacity>
        )}

        {/* Recording area */}
        <View className="flex-1 items-center justify-center px-6 py-8">
          {/* Voice Visualizer - breathing animation */}
          <VoiceVisualizer isRecording={isRecording} isPaused={isPaused} />

          {/* Timer below visualizer */}
          <View className="mt-4">
            <Timer
              durationMs={duration}
              maxDurationMs={timeLimitMs || RECORDING_CONFIG.MAX_DURATION_MS}
            />
          </View>

          {/* Time remaining indicator */}
          {isRecording && timeLimitMs > 0 && (
            <View
              className="mt-2 flex-row items-center px-3 py-1 rounded-full"
              style={{
                backgroundColor: isNearTimeLimit ? "#fb850030" : "#219ebc20",
              }}
            >
              <ClockIcon
                size={14}
                color={isNearTimeLimit ? "#fb8500" : "#8ecae6"}
              />
              <Text
                className="text-xs ml-1"
                style={{
                  fontFamily: "CabinetGrotesk-Medium",
                  color: isNearTimeLimit ? "#fb8500" : "#8ecae6",
                }}
              >
                {formatTime(remainingMs)} remaining
              </Text>
            </View>
          )}

          {/* Status indicator */}
          {isRecording && (
            <View
              className="mt-4 flex-row items-center px-4 py-2 rounded-full"
              style={{
                backgroundColor: isPaused ? "#fb850030" : "#ffb70330",
              }}
            >
              {isPaused ? (
                <PauseIcon size={20} color="#fb8500" />
              ) : (
                <View
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#ffb703" }}
                />
              )}
              <Text
                className="text-base ml-2"
                style={{
                  fontFamily: "CabinetGrotesk-Medium",
                  color: isPaused ? "#fb8500" : "#ffb703",
                }}
              >
                {isPaused ? "Paused" : "Recording..."}
              </Text>
            </View>
          )}

          {/* Record button - only shown when not recording */}
          {!isRecording && (
            <View className="mt-6">
              <RecordButton
                isRecording={false}
                onPress={handleRecordPress}
                disabled={false}
              />
            </View>
          )}

          {/* Control buttons - shown when recording */}
          {isRecording && (
            <View className="flex-row gap-8 mt-10">
              <ControlButton
                icon={isPaused ? PlayIcon : PauseIcon}
                label={isPaused ? "Resume" : "Pause"}
                onPress={handlePauseResume}
                variant="default"
              />
              <ControlButton
                icon={StopIcon}
                label="Analyze"
                onPress={handleStop}
                variant="success"
              />
              <ControlButton
                icon={ArrowPathIcon}
                label="Reset"
                onPress={handleReset}
                variant="danger"
              />
            </View>
          )}

          {/* Error message */}
          {recordingError && (
            <View
              className="mt-4 px-4 py-2 rounded-lg"
              style={{ backgroundColor: "#fb850030" }}
            >
              <Text
                className="text-center"
                style={{
                  fontFamily: "CabinetGrotesk-Regular",
                  color: "#fb8500",
                }}
              >
                {recordingError}
              </Text>
            </View>
          )}

          {/* Recording tips */}
          {!isRecording && duration === 0 && (
            <View className="mt-8 mx-4 bg-background-card rounded-2xl p-6 border border-secondary/20">
              <View className="flex-row items-center justify-center mb-4">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: "#ffb70330" }}
                >
                  <LightBulbIcon size={20} color="#ffb703" />
                </View>
                <Text
                  className="text-white ml-3"
                  style={{ fontFamily: "CabinetGrotesk-Bold" }}
                >
                  Tips for a great recording
                </Text>
              </View>
              <View className="gap-3">
                <View className="flex-row items-center">
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center"
                    style={{ backgroundColor: "#ffb703" }}
                  >
                    <Text
                      className="text-xs"
                      style={{
                        fontFamily: "CabinetGrotesk-Bold",
                        color: "#023047",
                      }}
                    >
                      1
                    </Text>
                  </View>
                  <Text
                    className="text-secondary-light ml-3 flex-1"
                    style={{ fontFamily: "CabinetGrotesk-Light" }}
                  >
                    Speak clearly for 1-5 minutes
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center"
                    style={{ backgroundColor: "#219ebc" }}
                  >
                    <Text
                      className="text-xs"
                      style={{
                        fontFamily: "CabinetGrotesk-Bold",
                        color: "#ffffff",
                      }}
                    >
                      2
                    </Text>
                  </View>
                  <Text
                    className="text-secondary-light ml-3 flex-1"
                    style={{ fontFamily: "CabinetGrotesk-Light" }}
                  >
                    Find a quiet environment
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center"
                    style={{ backgroundColor: "#fb8500" }}
                  >
                    <Text
                      className="text-xs"
                      style={{
                        fontFamily: "CabinetGrotesk-Bold",
                        color: "#ffffff",
                      }}
                    >
                      3
                    </Text>
                  </View>
                  <Text
                    className="text-secondary-light ml-3 flex-1"
                    style={{ fontFamily: "CabinetGrotesk-Light" }}
                  >
                    We'll analyze filler words, pauses & pace
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Edit Context Modal */}
      <SpeechContextModal
        visible={showEditContext}
        onClose={() => setShowEditContext(false)}
        onSubmit={handleContextUpdate}
        initialContext={speechContext}
      />
    </SafeAreaView>
  );
}
