import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MicrophoneIcon,
  ClockIcon,
  ChartBarIcon,
  SparklesIcon,
  UserCircleIcon,
} from "react-native-heroicons/outline";
import { useUser } from "@clerk/clerk-expo";

import { useStorage } from "../../src/hooks/useStorage";
import { SessionList } from "../../src/components/sessions/SessionList";
import { LoadingSpinner } from "../../src/components/ui/LoadingSpinner";
import { useThemedAlert } from "../../src/components/ui/ThemedAlert";

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
  const { sessions, isLoading, deleteSession } = useStorage();
  const { user } = useUser();
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

  // Calculate stats
  const totalSessions = sessions.length;
  const totalMinutes = Math.round(
    sessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60000,
  );
  const scoredSessions = sessions.filter(
    (s) => s.aiFeedback?.overallScore || s.analysis?.score?.overallScore,
  );
  const averageScore =
    scoredSessions.length > 0
      ? Math.round(
          scoredSessions.reduce((acc, s) => {
            // Prefer AI score (1-10), fall back to local score (1-5 scaled to 10)
            const aiScore = s.aiFeedback?.overallScore || 0;
            const localScore = (s.analysis?.score?.overallScore || 0) * 2;
            return acc + (aiScore || localScore);
          }, 0) / scoredSessions.length,
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
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <SparklesIcon size={28} color="#ffb703" />
              <Text
                className="text-3xl text-white ml-2"
                style={{ fontFamily: "CabinetGrotesk-Bold" }}
              >
                Speechi
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                if (user) {
                  router.push("/profile");
                } else {
                  router.push("/sign-in");
                }
              }}
              activeOpacity={0.7}
            >
              {user?.imageUrl ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    borderWidth: 2,
                    borderColor: "#ffb703",
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "#034569",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <UserCircleIcon size={24} color="#8ecae6" />
                </View>
              )}
            </TouchableOpacity>
          </View>
          <Text
            className="text-secondary-light"
            style={{ fontFamily: "CabinetGrotesk-Light" }}
          >
            {user ? `Welcome back, ${user.firstName || "speaker"}!` : "Improve your presentation skills"}
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
              icon={ChartBarIcon}
              value={averageScore > 0 ? `${averageScore}/10` : "-"}
              label="Avg Score"
              color="#fb8500"
            />
          </View>
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
            {sessions.length > 0 && (
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

          {isLoading ? (
            <LoadingSpinner message="Loading sessions..." />
          ) : sessions.length > 0 ? (
            <SessionList
              sessions={sessions}
              isLoading={isLoading}
              maxItems={5}
              onDeleteSession={handleDeleteSession}
            />
          ) : (
            <View className="bg-background-card rounded-2xl p-8 items-center border border-secondary/20">
              <MicrophoneIcon size={48} color="#8ecae6" />
              <Text
                className="text-white mt-4 text-center"
                style={{ fontFamily: "CabinetGrotesk-Medium" }}
              >
                No recordings yet
              </Text>
              <Text
                className="text-secondary-light text-center mt-2 text-sm"
                style={{ fontFamily: "CabinetGrotesk-Light" }}
              >
                Tap the button below to start practicing
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
