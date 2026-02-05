import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useStorage } from "../../src/hooks/useStorage";
import { useProgressStats } from "../../src/hooks/useProgressStats";
import { SessionList } from "../../src/components/sessions/SessionList";
import { LoadingSpinner } from "../../src/components/ui/LoadingSpinner";

// Feature card component
function FeatureCard({
  iconName,
  title,
  description,
  onPress,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-background-card rounded-2xl p-5 mb-4 border border-secondary-light"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center">
        <View className="bg-primary-light w-12 h-12 rounded-full items-center justify-center mr-4">
          <Ionicons name={iconName} size={24} color="#006d77" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-primary-dark">
            {title}
          </Text>
          <Text className="text-sm text-secondary-dark mt-1">
            {description}
          </Text>
        </View>
        <Ionicons name="chevron-forward-outline" size={20} color="#83c5be" />
      </View>
    </TouchableOpacity>
  );
}

// Stats card component
function StatsCard({
  iconName,
  value,
  label,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View className="bg-background-card rounded-xl p-4 flex-1 items-center border border-secondary-light">
      <Ionicons name={iconName} size={24} color="#006d77" />
      <Text className="text-2xl font-bold text-primary-dark mt-2">{value}</Text>
      <Text className="text-xs text-secondary-dark text-center mt-1">
        {label}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { sessions, isLoading, clearAllSessions } = useStorage();

  const handleClearHistory = () => {
    Alert.alert(
      "Delete All Sessions",
      "Are you sure you want to delete all recording history? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await clearAllSessions();
          },
        },
      ],
    );
  };

  // Calculate stats
  const totalSessions = sessions.length;
  const totalMinutes = Math.round(
    sessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60000,
  );
  const averageScore =
    sessions.length > 0
      ? Math.round(
          sessions
            .filter((s) => s.analysis?.score?.overallScore)
            .reduce((acc, s) => acc + (s.analysis?.score?.overallScore || 0), 0) /
            Math.max(
              sessions.filter((s) => s.analysis?.score?.overallScore).length,
              1,
            ),
        )
      : 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-3xl font-bold text-primary-dark">
            Speech Coach
          </Text>
          <Text className="text-secondary-dark mt-1">
            Improve your presentation skills
          </Text>
        </View>

        {/* Stats */}
        <View className="px-6 mb-6">
          <View className="flex-row gap-3">
            <StatsCard
              iconName="mic-outline"
              value={totalSessions.toString()}
              label="Sessions"
            />
            <StatsCard
              iconName="time-outline"
              value={`${totalMinutes}m`}
              label="Practiced"
            />
            <StatsCard
              iconName="star-outline"
              value={averageScore > 0 ? `${averageScore}%` : "-"}
              label="Avg Score"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-semibold text-primary-dark mb-3">
            Quick Actions
          </Text>
          <FeatureCard
            iconName="mic-outline"
            title="Start Recording"
            description="Practice your speech and get AI feedback"
            onPress={() => router.push("/(tabs)/record")}
          />
          <FeatureCard
            iconName="document-text-outline"
            title="Analyze PPT"
            description="Get feedback on your presentation slides"
            onPress={() => router.push("/(tabs)/ppt-analyzer")}
          />
        </View>

        {/* Recent Sessions */}
        <View className="px-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold text-primary-dark">
              Recent Sessions
            </Text>
            <View className="flex-row gap-3">
              {sessions.length > 0 && (
                <TouchableOpacity onPress={handleClearHistory}>
                  <Ionicons name="trash-outline" size={20} color="#e29578" />
                </TouchableOpacity>
              )}
              {sessions.length > 3 && (
                <TouchableOpacity onPress={() => router.push("/history")}>
                  <Text className="text-primary font-medium">View All</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {isLoading ? (
            <LoadingSpinner message="Loading sessions..." />
          ) : sessions.length > 0 ? (
            <SessionList
              sessions={sessions}
              isLoading={isLoading}
              maxItems={3}
            />
          ) : (
            <View className="bg-background-card rounded-2xl p-6 items-center border border-secondary-light">
              <Ionicons name="recording-outline" size={48} color="#83c5be" />
              <Text className="text-primary-dark font-medium mt-4 text-center">
                No recordings yet
              </Text>
              <Text className="text-secondary-dark text-center mt-1 text-sm">
                Start your first practice session to see your progress
              </Text>
            </View>
          )}
        </View>

        {/* Tips Section */}
        <View className="px-6 mt-6">
          <Text className="text-lg font-semibold text-primary-dark mb-3">
            Quick Tips
          </Text>
          <View className="bg-primary-light rounded-2xl p-5">
            <View className="flex-row items-start mb-3">
              <Ionicons name="bulb-outline" size={20} color="#006d77" />
              <Text className="text-primary-dark ml-3 flex-1">
                Speak at 120-160 words per minute for optimal clarity
              </Text>
            </View>
            <View className="flex-row items-start mb-3">
              <Ionicons
                name="volume-medium-outline"
                size={20}
                color="#006d77"
              />
              <Text className="text-primary-dark ml-3 flex-1">
                Avoid filler words like "um", "uh", and "like"
              </Text>
            </View>
            <View className="flex-row items-start">
              <Ionicons name="pause-outline" size={20} color="#006d77" />
              <Text className="text-primary-dark ml-3 flex-1">
                Use strategic pauses to emphasize key points
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
