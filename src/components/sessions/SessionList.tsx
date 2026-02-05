import { View, Text, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { RecordingSession } from "../../types/recording";
import { SessionCard } from "./SessionCard";
import { LoadingSpinner } from "../ui/LoadingSpinner";

interface SessionListProps {
  sessions: RecordingSession[];
  isLoading?: boolean;
  emptyMessage?: string;
  showAll?: boolean;
  maxItems?: number;
}

export function SessionList({
  sessions,
  isLoading = false,
  emptyMessage = "No recordings yet",
  showAll = false,
  maxItems = 5,
}: SessionListProps) {
  const router = useRouter();

  if (isLoading) {
    return <LoadingSpinner message="Loading sessions..." />;
  }

  const displayedSessions = showAll ? sessions : sessions.slice(0, maxItems);

  if (displayedSessions.length === 0) {
    return (
      <View className="items-center py-8">
        <Text className="text-gray-500 text-center">{emptyMessage}</Text>
      </View>
    );
  }

  const handleSessionPress = (session: RecordingSession) => {
    router.push(`/analysis/${session.id}`);
  };

  return (
    <View>
      {displayedSessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          onPress={() => handleSessionPress(session)}
        />
      ))}

      {!showAll && sessions.length > maxItems && (
        <Text
          className="text-center text-primary-600 font-medium py-2"
          onPress={() => router.push("/history")}
        >
          View all {sessions.length} sessions →
        </Text>
      )}
    </View>
  );
}
