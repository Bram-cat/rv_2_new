import { View, Text, TouchableOpacity } from "react-native";
import { RecordingSession } from "../../types/recording";
import { formatDate, formatDurationLong } from "../../utils/formatters";
import { StarRating } from "../ui/StarRating";

interface SessionCardProps {
  session: RecordingSession;
  onPress: () => void;
  onDelete?: () => void;
}

export function SessionCard({ session, onPress, onDelete }: SessionCardProps) {
  const hasAnalysis = session.analysis !== null;
  const score = session.analysis?.score.overallScore ?? 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl p-4 shadow-sm mb-3"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          {/* Title or date */}
          <Text className="text-base font-semibold text-gray-800">
            {session.title || formatDate(session.createdAt)}
          </Text>

          {/* Duration */}
          <Text className="text-sm text-gray-500 mt-1">
            {formatDurationLong(session.duration)}
          </Text>
        </View>

        {/* Score or status */}
        <View className="items-end">
          {hasAnalysis ? (
            <>
              <StarRating rating={score} size="small" />
              <Text className="text-xs text-gray-400 mt-1">{score}/5</Text>
            </>
          ) : (
            <View className="bg-gray-100 px-2 py-1 rounded">
              <Text className="text-xs text-gray-500">
                {session.transcription ? "Analyzing..." : "Not analyzed"}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Preview of transcription */}
      {session.transcription?.text && (
        <Text
          className="text-sm text-gray-600 mt-2"
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          "{session.transcription.text}"
        </Text>
      )}
    </TouchableOpacity>
  );
}
