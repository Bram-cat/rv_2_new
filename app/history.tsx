import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MicrophoneIcon,
  TrashIcon,
  ClockIcon,
  ChartBarIcon,
} from "react-native-heroicons/outline";

import { useStorage } from "../src/hooks/useStorage";
import { SessionList } from "../src/components/sessions/SessionList";
import { LoadingSpinner } from "../src/components/ui/LoadingSpinner";
import { useThemedAlert } from "../src/components/ui/ThemedAlert";

export default function HistoryScreen() {
  const router = useRouter();
  const { sessions, isLoading, deleteSession, clearAllSessions } = useStorage();
  const { showAlert } = useThemedAlert();

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteSession(id);
    } catch (error) {
      showAlert({
        title: "Delete Failed",
        message: "Failed to delete session.",
        type: "error",
      });
    }
  };

  const handleClearAll = () => {
    showAlert({
      title: "Clear All Sessions",
      message: "Are you sure you want to delete all recording sessions? This cannot be undone.",
      type: "warning",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAllSessions();
            } catch (error) {
              showAlert({
                title: "Clear Failed",
                message: "Failed to clear sessions.",
                type: "error",
              });
            }
          },
        },
      ],
    });
  };

  // Calculate stats
  const totalMinutes = Math.round(
    sessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60000,
  );
  const analyzedCount = sessions.filter((s) => s.analysis).length;
  const averageScore =
    analyzedCount > 0
      ? (
          sessions
            .filter((s) => s.analysis?.score?.overallScore)
            .reduce(
              (acc, s) => acc + (s.analysis?.score?.overallScore || 0),
              0,
            ) /
          Math.max(
            sessions.filter((s) => s.analysis?.score?.overallScore).length,
            1,
          )
        ).toFixed(1)
      : "-";

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <LoadingSpinner message="Loading sessions..." />
      </SafeAreaView>
    );
  }

  if (sessions.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center px-6">
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: "#219ebc20" }}
          >
            <MicrophoneIcon size={48} color="#8ecae6" />
          </View>
          <Text
            className="text-xl text-white mb-2 text-center"
            style={{ fontFamily: "CabinetGrotesk-Bold" }}
          >
            No Sessions Yet
          </Text>
          <Text
            className="text-secondary-light text-center mb-6"
            style={{ fontFamily: "CabinetGrotesk-Light" }}
          >
            Start recording to see your session history here.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/")}
            className="bg-accent rounded-xl px-8 py-4"
          >
            <Text
              className="text-primary text-base"
              style={{ fontFamily: "CabinetGrotesk-Bold" }}
            >
              Start Recording
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-4">
          {/* Stats row */}
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1 bg-background-card rounded-xl p-4 items-center border border-secondary/20">
              <MicrophoneIcon size={20} color="#ffb703" />
              <Text
                className="text-2xl text-white mt-1"
                style={{ fontFamily: "CabinetGrotesk-Bold" }}
              >
                {sessions.length}
              </Text>
              <Text
                className="text-xs text-secondary-light"
                style={{ fontFamily: "CabinetGrotesk-Light" }}
              >
                Sessions
              </Text>
            </View>
            <View className="flex-1 bg-background-card rounded-xl p-4 items-center border border-secondary/20">
              <ClockIcon size={20} color="#219ebc" />
              <Text
                className="text-2xl text-white mt-1"
                style={{ fontFamily: "CabinetGrotesk-Bold" }}
              >
                {totalMinutes}m
              </Text>
              <Text
                className="text-xs text-secondary-light"
                style={{ fontFamily: "CabinetGrotesk-Light" }}
              >
                Practiced
              </Text>
            </View>
            <View className="flex-1 bg-background-card rounded-xl p-4 items-center border border-secondary/20">
              <ChartBarIcon size={20} color="#fb8500" />
              <Text
                className="text-2xl text-white mt-1"
                style={{ fontFamily: "CabinetGrotesk-Bold" }}
              >
                {averageScore}
              </Text>
              <Text
                className="text-xs text-secondary-light"
                style={{ fontFamily: "CabinetGrotesk-Light" }}
              >
                Avg Score
              </Text>
            </View>
          </View>

          {/* Section header */}
          <View className="flex-row justify-between items-center mb-3">
            <Text
              className="text-lg text-white"
              style={{ fontFamily: "CabinetGrotesk-Medium" }}
            >
              All Sessions
            </Text>
            {sessions.length > 0 && (
              <TouchableOpacity
                onPress={handleClearAll}
                className="flex-row items-center px-3 py-1.5 rounded-full"
                style={{ backgroundColor: "#fb850020" }}
              >
                <TrashIcon size={14} color="#fb8500" />
                <Text
                  className="text-xs ml-1"
                  style={{
                    fontFamily: "CabinetGrotesk-Medium",
                    color: "#fb8500",
                  }}
                >
                  Clear All
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Sessions list with delete */}
          <SessionList
            sessions={sessions}
            showAll={true}
            onDeleteSession={handleDeleteSession}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
