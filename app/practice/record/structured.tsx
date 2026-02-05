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
  getTemplateById,
  PracticeTemplate,
} from "../../../src/constants/templates";
import { TemplateId } from "../../../src/types/recording";

export default function StructuredRecordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    templateId: string;
    targetDuration: string;
  }>();

  const templateId = params.templateId as TemplateId;
  const targetDuration = parseInt(params.targetDuration || "180", 10) * 1000; // Convert to ms

  const [template, setTemplate] = useState<PracticeTemplate | null>(null);

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
    if (templateId) {
      const t = getTemplateById(templateId);
      if (t) setTemplate(t);
    }
  }, [templateId]);

  const handleStartRecording = async () => {
    await startRecording();
  };

  const handleStopAndAnalyze = async () => {
    const audioUri = await stopRecording();
    if (audioUri && template) {
      const sessionId = Crypto.randomUUID();
      await addSession({
        id: sessionId,
        createdAt: new Date().toISOString(),
        audioUri,
        duration,
        transcription: null,
        analysis: null,
        aiFeedback: null,
        practiceMode: "structured",
        templateId: template.id,
        targetDuration: targetDuration / 1000,
        title: template.name,
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

  if (!template) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <LoadingSpinner message="Loading template..." />
      </SafeAreaView>
    );
  }

  const targetMin = Math.floor(targetDuration / 60000);
  const targetSec = Math.floor((targetDuration % 60000) / 1000);
  const progress = duration / targetDuration;
  const isNearEnd = progress > 0.8;

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
              {template.name}
            </Text>
            <Text className="text-secondary-dark text-sm">
              Target: {targetMin}:{targetSec.toString().padStart(2, "0")}
            </Text>
          </View>
          <View className="bg-primary-light px-3 py-1 rounded-full">
            <Text className="text-primary-dark text-sm font-medium">
              {template.targetWPM.min}-{template.targetWPM.max} WPM
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
        {/* Timer with Target */}
        <View className="items-center mb-8">
          <Timer
            duration={duration}
            maxDuration={targetDuration}
            showWarning={isNearEnd}
          />
          <Text
            className={`text-sm mt-2 ${
              isNearEnd ? "text-accent" : "text-secondary-dark"
            }`}
          >
            {isNearEnd
              ? "Almost at target time!"
              : `Target: ${targetMin}:${targetSec.toString().padStart(2, "0")}`}
          </Text>
        </View>

        {/* Tips Panel */}
        {!isRecording && (
          <View className="bg-primary-light rounded-2xl p-5 mb-8">
            <View className="flex-row items-center mb-3">
              <Ionicons name={template.icon} size={20} color="#006d77" />
              <Text className="text-sm font-semibold text-primary-dark ml-2">
                {template.name} Tips
              </Text>
            </View>
            {template.tips.map((tip, index) => (
              <View key={index} className="flex-row items-start mt-2">
                <Ionicons name="checkmark-circle" size={16} color="#006d77" />
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
            isPaused={isPaused}
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
              : "Recording... will auto-stop at target time"
            : "Tap to start your presentation"}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
