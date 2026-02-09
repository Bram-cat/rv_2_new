import { View, Text, TouchableOpacity } from "react-native";
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
  onDeleteSession?: (id: string) => void;
}

export function SessionList({
  sessions,
  isLoading = false,
  emptyMessage = "No recordings yet",
  showAll = false,
  maxItems = 5,
  onDeleteSession,
}: SessionListProps) {
  const router = useRouter();

  if (isLoading) {
    return <LoadingSpinner message="Loading sessions..." />;
  }

  const displayedSessions = showAll ? sessions : sessions.slice(0, maxItems);

  if (displayedSessions.length === 0) {
    return (
      <View className="items-center py-8">
        <Text
          className="text-center"
          style={{
            fontFamily: "CabinetGrotesk-Light",
            color: "#8ecae6",
          }}
        >
          {emptyMessage}
        </Text>
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
          onDelete={
            onDeleteSession ? () => onDeleteSession(session.id) : undefined
          }
        />
      ))}

      {!showAll && sessions.length > maxItems && (
        <TouchableOpacity
          onPress={() => router.push("/history")}
          className="py-2"
        >
          <Text
            className="text-center"
            style={{
              fontFamily: "CabinetGrotesk-Medium",
              color: "#ffb703",
            }}
          >
            View all {sessions.length} sessions
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
