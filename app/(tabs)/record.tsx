import { View, Text, ScrollView, Alert, TouchableOpacity } from "react-native";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import * as Crypto from "expo-crypto";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { usePermissions } from "../../src/hooks/usePermissions";
import { useAudioRecording } from "../../src/hooks/useAudioRecording";
import { useStorage } from "../../src/hooks/useStorage";

import { RecordButton } from "../../src/components/recording/RecordButton";
import { Timer } from "../../src/components/recording/Timer";
import { Button } from "../../src/components/ui/Button";
import { LoadingSpinner } from "../../src/components/ui/LoadingSpinner";

import { RECORDING_CONFIG } from "../../src/constants/thresholds";

// Generate a unique ID using expo-crypto
function generateId(): string {
  return Crypto.randomUUID();
}

// Control button component with Ionicons
function ControlButton({
  iconName,
  label,
  onPress,
  variant = "default",
  disabled = false,
  size = "medium",
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  variant?: "default" | "danger" | "success";
  disabled?: boolean;
  size?: "small" | "medium";
}) {
  const bgColors = {
    default: "bg-secondary",
    danger: "bg-accent",
    success: "bg-primary",
  };

  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-20 h-20",
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
        className={`${sizeClasses[size]} rounded-full items-center justify-center ${bgColors[variant]} ${disabled ? "opacity-50" : ""}`}
        style={{
          shadowColor: "#006d77",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <Ionicons name={iconName} size={iconSizes[size]} color="#ffffff" />
      </View>
      <Text className="text-xs text-primary-dark mt-2 font-medium">{label}</Text>
    </TouchableOpacity>
  );
}

export default function RecordScreen() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

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
        `Failed to save recording: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsSaving(false);
    }
  }, [stopRecording, duration, addSession, router, resetRecording, isSaving]);

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
      ]
    );
  }, [resetRecording]);

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
          <View className="bg-secondary-light w-24 h-24 rounded-full items-center justify-center mb-6">
            <Ionicons name="mic-outline" size={48} color="#006d77" />
          </View>
          <Text
            className="text-xl text-primary-dark mb-2 text-center"
            style={{ fontFamily: "Satoshi-Bold" }}
          >
            Microphone Access Required
          </Text>
          <Text
            className="text-secondary-dark text-center mb-6"
            style={{ fontFamily: "Satoshi-Regular" }}
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
          <View className="bg-primary w-20 h-20 rounded-full items-center justify-center mb-6">
            <Ionicons name="analytics-outline" size={40} color="#ffffff" />
          </View>
          <LoadingSpinner message="Analyzing your speech..." />
        </View>
      </SafeAreaView>
    );
  }

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
            className="text-2xl text-primary-dark text-center"
            style={{ fontFamily: "Satoshi-Bold" }}
          >
            Record Speech
          </Text>
          <Text
            className="text-secondary-dark text-center mt-1"
            style={{ fontFamily: "Satoshi-Regular" }}
          >
            Practice your presentation skills
          </Text>
        </View>

        {/* Recording area */}
        <View className="flex-1 items-center justify-center px-6 py-8">
          {/* Timer */}
          <Timer
            durationMs={duration}
            maxDurationMs={RECORDING_CONFIG.MAX_DURATION_MS}
          />

          {/* Status indicator */}
          {isRecording && (
            <View className="mt-4 flex-row items-center bg-accent-light px-4 py-2 rounded-full">
              <Ionicons
                name={isPaused ? "pause-circle" : "radio"}
                size={20}
                color={isPaused ? "#e29578" : "#006d77"}
              />
              <Text
                className={`text-base ml-2 ${isPaused ? "text-accent" : "text-primary"}`}
                style={{ fontFamily: "Satoshi-Medium" }}
              >
                {isPaused ? "Paused" : "Recording..."}
              </Text>
            </View>
          )}

          {/* Record button */}
          <View className="mt-8">
            <RecordButton
              isRecording={isRecording && !isPaused}
              onPress={handleRecordPress}
              disabled={isRecording}
            />
          </View>

          {/* Control buttons - shown when recording */}
          {isRecording && (
            <View className="flex-row gap-8 mt-10">
              <ControlButton
                iconName={isPaused ? "play" : "pause"}
                label={isPaused ? "Resume" : "Pause"}
                onPress={handlePauseResume}
                variant="default"
              />
              <ControlButton
                iconName="stop"
                label="Analyze"
                onPress={handleStop}
                variant="success"
              />
              <ControlButton
                iconName="refresh"
                label="Reset"
                onPress={handleReset}
                variant="danger"
              />
            </View>
          )}

          {/* Error message */}
          {recordingError && (
            <View className="mt-4 bg-accent-light px-4 py-2 rounded-lg">
              <Text
                className="text-accent-dark text-center"
                style={{ fontFamily: "Satoshi-Regular" }}
              >
                {recordingError}
              </Text>
            </View>
          )}

          {/* Recording tips */}
          {!isRecording && duration === 0 && (
            <View className="mt-8 mx-4 bg-background-card rounded-2xl p-6 border border-secondary">
              <View className="flex-row items-center justify-center mb-4">
                <View className="bg-accent-light w-10 h-10 rounded-full items-center justify-center">
                  <Ionicons name="bulb" size={20} color="#e29578" />
                </View>
                <Text
                  className="text-primary-dark ml-3"
                  style={{ fontFamily: "Satoshi-Bold" }}
                >
                  Tips for a great recording
                </Text>
              </View>
              <View className="gap-3">
                <View className="flex-row items-center">
                  <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                    <Text className="text-white text-xs" style={{ fontFamily: "Satoshi-Bold" }}>1</Text>
                  </View>
                  <Text
                    className="text-primary-dark ml-3 flex-1"
                    style={{ fontFamily: "Satoshi-Regular" }}
                  >
                    Speak clearly for 1-5 minutes
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-6 h-6 rounded-full bg-secondary items-center justify-center">
                    <Text className="text-white text-xs" style={{ fontFamily: "Satoshi-Bold" }}>2</Text>
                  </View>
                  <Text
                    className="text-primary-dark ml-3 flex-1"
                    style={{ fontFamily: "Satoshi-Regular" }}
                  >
                    Find a quiet environment
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-6 h-6 rounded-full bg-accent items-center justify-center">
                    <Text className="text-white text-xs" style={{ fontFamily: "Satoshi-Bold" }}>3</Text>
                  </View>
                  <Text
                    className="text-primary-dark ml-3 flex-1"
                    style={{ fontFamily: "Satoshi-Regular" }}
                  >
                    We'll analyze filler words, pauses & pace
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
