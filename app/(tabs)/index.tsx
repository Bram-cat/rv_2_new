import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MicrophoneIcon,
  DocumentTextIcon,
  ChevronRightIcon,
  ClockIcon,
  StarIcon,
  TrashIcon,
  LightBulbIcon,
  SpeakerWaveIcon,
  PauseIcon,
  SparklesIcon,
} from "react-native-heroicons/outline";

import { useStorage } from "../../src/hooks/useStorage";
import { useProgressStats } from "../../src/hooks/useProgressStats";
import { SessionList } from "../../src/components/sessions/SessionList";
import { LoadingSpinner } from "../../src/components/ui/LoadingSpinner";

// Feature card component
function FeatureCard({
  icon: Icon,
  title,
  description,
  onPress,
  accentColor = "#ffb703",
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  description: string;
  onPress: () => void;
  accentColor?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-background-card rounded-2xl p-5 mb-4 border border-secondary/20"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center">
        <View
          className="w-12 h-12 rounded-full items-center justify-center mr-4"
          style={{ backgroundColor: accentColor + "20" }}
        >
          <Icon size={24} color={accentColor} />
        </View>
        <View className="flex-1">
          <Text
            className="text-lg text-white"
            style={{ fontFamily: "CabinetGrotesk-Medium" }}
          >
            {title}
          </Text>
          <Text
            className="text-sm text-secondary-light mt-1"
            style={{ fontFamily: "CabinetGrotesk-Light" }}
          >
            {description}
          </Text>
        </View>
        <ChevronRightIcon size={20} color="#8ecae6" />
      </View>
    </TouchableOpacity>
  );
}

// Stats card component
function StatsCard({
  icon: Icon,
  value,
  label,
  color = "#ffb703",
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <View className="bg-background-card rounded-xl p-4 flex-1 items-center border border-secondary/20">
      <Icon size={24} color={color} />
      <Text
        className="text-2xl text-white mt-2"
        style={{ fontFamily: "CabinetGrotesk-Bold" }}
      >
        {value}
      </Text>
      <Text
        className="text-xs text-secondary-light text-center mt-1"
        style={{ fontFamily: "CabinetGrotesk-Light" }}
      >
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
          <View className="flex-row items-center mb-2">
            <SparklesIcon size={28} color="#ffb703" />
            <Text
              className="text-3xl text-white ml-2"
              style={{ fontFamily: "CabinetGrotesk-Bold" }}
            >
              Speechi
            </Text>
          </View>
          <Text
            className="text-secondary-light"
            style={{ fontFamily: "CabinetGrotesk-Light" }}
          >
            Improve your presentation skills
          </Text>
        </View>

        {/* Stats */}
        <View className="px-6 mb-6">
          <View className="flex-row gap-3">
            <StatsCard
              icon={MicrophoneIcon}
              value={totalSessions.toString()}
              label="Sessions"
              color="#ffb703"
            />
            <StatsCard
              icon={ClockIcon}
              value={`${totalMinutes}m`}
              label="Practiced"
              color="#219ebc"
            />
            <StatsCard
              icon={StarIcon}
              value={averageScore > 0 ? `${averageScore}%` : "-"}
              label="Avg Score"
              color="#fb8500"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-6">
          <Text
            className="text-lg text-white mb-3"
            style={{ fontFamily: "CabinetGrotesk-Medium" }}
          >
            Quick Actions
          </Text>
          <FeatureCard
            icon={MicrophoneIcon}
            title="Start Recording"
            description="Practice your speech and get AI feedback"
            onPress={() => router.push("/(tabs)/record")}
            accentColor="#ffb703"
          />
          <FeatureCard
            icon={DocumentTextIcon}
            title="Analyze Slides"
            description="Get feedback on your presentation slides"
            onPress={() => router.push("/(tabs)/ppt-analyzer")}
            accentColor="#219ebc"
          />
        </View>

        {/* Recent Sessions */}
        <View className="px-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text
              className="text-lg text-white"
              style={{ fontFamily: "CabinetGrotesk-Medium" }}
            >
              Recent Sessions
            </Text>
            <View className="flex-row gap-3">
              {sessions.length > 0 && (
                <TouchableOpacity onPress={handleClearHistory}>
                  <TrashIcon size={20} color="#fb8500" />
                </TouchableOpacity>
              )}
              {sessions.length > 3 && (
                <TouchableOpacity onPress={() => router.push("/history")}>
                  <Text
                    className="text-accent"
                    style={{ fontFamily: "CabinetGrotesk-Medium" }}
                  >
                    View All
                  </Text>
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
            <View className="bg-background-card rounded-2xl p-6 items-center border border-secondary/20">
              <MicrophoneIcon size={48} color="#8ecae6" />
              <Text
                className="text-white mt-4 text-center"
                style={{ fontFamily: "CabinetGrotesk-Medium" }}
              >
                No recordings yet
              </Text>
              <Text
                className="text-secondary-light text-center mt-1 text-sm"
                style={{ fontFamily: "CabinetGrotesk-Light" }}
              >
                Start your first practice session to see your progress
              </Text>
            </View>
          )}
        </View>

        {/* Tips Section */}
        <View className="px-6 mt-6">
          <Text
            className="text-lg text-white mb-3"
            style={{ fontFamily: "CabinetGrotesk-Medium" }}
          >
            Quick Tips
          </Text>
          <View className="bg-background-card rounded-2xl p-5 border border-secondary/20">
            <View className="flex-row items-start mb-3">
              <LightBulbIcon size={20} color="#ffb703" />
              <Text
                className="text-secondary-light ml-3 flex-1"
                style={{ fontFamily: "CabinetGrotesk-Light" }}
              >
                Speak at 120-160 words per minute for optimal clarity
              </Text>
            </View>
            <View className="flex-row items-start mb-3">
              <SpeakerWaveIcon size={20} color="#219ebc" />
              <Text
                className="text-secondary-light ml-3 flex-1"
                style={{ fontFamily: "CabinetGrotesk-Light" }}
              >
                Avoid filler words like "um", "uh", and "like"
              </Text>
            </View>
            <View className="flex-row items-start">
              <PauseIcon size={20} color="#fb8500" />
              <Text
                className="text-secondary-light ml-3 flex-1"
                style={{ fontFamily: "CabinetGrotesk-Light" }}
              >
                Use strategic pauses to emphasize key points
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
