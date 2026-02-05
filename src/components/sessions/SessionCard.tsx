import { View, Text, TouchableOpacity } from "react-native";
import { ChevronRightIcon, ClockIcon } from "react-native-heroicons/outline";
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
      className="rounded-2xl p-4 mb-3 border"
      style={{
        backgroundColor: "#034569",
        borderColor: "#21628830",
      }}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          {/* Title or date */}
          <Text
            className="text-base text-white"
            style={{ fontFamily: "CabinetGrotesk-Medium" }}
          >
            {session.title || formatDate(session.createdAt)}
          </Text>

          {/* Duration */}
          <View className="flex-row items-center mt-1">
            <ClockIcon size={14} color="#8ecae6" />
            <Text
              className="text-sm ml-1"
              style={{
                fontFamily: "CabinetGrotesk-Light",
                color: "#8ecae6",
              }}
            >
              {formatDurationLong(session.duration)}
            </Text>
          </View>
        </View>

        {/* Score or status */}
        <View className="items-end flex-row">
          {hasAnalysis ? (
            <View className="flex-row items-center">
              <StarRating rating={score} size="small" />
              <ChevronRightIcon size={20} color="#8ecae6" />
            </View>
          ) : (
            <View
              className="px-2 py-1 rounded-full"
              style={{ backgroundColor: "#219ebc30" }}
            >
              <Text
                className="text-xs"
                style={{
                  fontFamily: "CabinetGrotesk-Medium",
                  color: "#8ecae6",
                }}
              >
                {session.transcription ? "Analyzing..." : "View"}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Preview of transcription */}
      {session.transcription?.text && (
        <Text
          className="text-sm mt-2"
          style={{
            fontFamily: "CabinetGrotesk-Light",
            color: "#6bb8d4",
          }}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          "{session.transcription.text}"
        </Text>
      )}
    </TouchableOpacity>
  );
}
