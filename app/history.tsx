import { View, Text, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useStorage } from "../src/hooks/useStorage";
import { SessionList } from "../src/components/sessions/SessionList";
import { Button } from "../src/components/ui/Button";
import { LoadingSpinner } from "../src/components/ui/LoadingSpinner";

export default function HistoryScreen() {
  const router = useRouter();
  const { sessions, isLoading, clearAllSessions } = useStorage();

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Sessions",
      "Are you sure you want to delete all recording sessions? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAllSessions();
            } catch (error) {
              Alert.alert("Error", "Failed to clear sessions.");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
        <LoadingSpinner message="Loading sessions..." />
      </SafeAreaView>
    );
  }

  if (sessions.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-6xl mb-4">📝</Text>
          <Text className="text-xl font-semibold text-gray-800 mb-2">
            No Sessions Yet
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            Start recording to see your session history here.
          </Text>
          <Button title="Start Recording" onPress={() => router.push("/")} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-4">
          {/* Header stats */}
          <View className="bg-white rounded-2xl p-4 shadow-sm mb-6">
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-2xl font-bold text-gray-800">
                  {sessions.length}
                </Text>
                <Text className="text-sm text-gray-500">Total Sessions</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-gray-800">
                  {sessions.filter((s) => s.analysis).length}
                </Text>
                <Text className="text-sm text-gray-500">Analyzed</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary-600">
                  {sessions.filter((s) => (s.analysis?.score?.overallScore ?? 0) >= 4).length}
                </Text>
                <Text className="text-sm text-gray-500">High Scores</Text>
              </View>
            </View>
          </View>

          {/* Sessions list */}
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            All Sessions
          </Text>
          <SessionList sessions={sessions} showAll={true} />

          {/* Clear all button */}
          {sessions.length > 0 && (
            <View className="mt-6">
              <Button
                title="Clear All Sessions"
                onPress={handleClearAll}
                variant="danger"
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
