import { View, Text, TouchableOpacity } from "react-native";
import {
  ChevronRightIcon,
  ClockIcon,
  TrashIcon,
  AcademicCapIcon,
} from "react-native-heroicons/outline";
import { RecordingSession } from "../../types/recording";
import { formatDate, formatDurationLong } from "../../utils/formatters";
import { useThemedAlert } from "../ui/ThemedAlert";

interface SessionCardProps {
  session: RecordingSession;
  onPress: () => void;
  onDelete?: () => void;
}

export function SessionCard({ session, onPress, onDelete }: SessionCardProps) {
  const { showAlert } = useThemedAlert();
  const hasAnalysis = session.analysis !== null;
  // Prefer AI score (1-10), fall back to local score (1-5 scaled to 10)
  const aiScore = session.aiFeedback?.overallScore || 0;
  const localScore = (session.analysis?.score?.overallScore || 0) * 2;
  const score = aiScore || localScore;

  const scoreColor =
    score >= 8 ? "#22c55e" : score >= 5 ? "#ffb703" : "#fb8500";

  const handleDelete = () => {
    showAlert({
      title: "Delete Session",
      message: "Are you sure you want to delete this recording?",
      type: "warning",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: onDelete,
        },
      ],
    });
  };

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

          {/* Duration + practice badge */}
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
            {session.practiceMode === "free" && (
              <View
                className="flex-row items-center ml-2 px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "#ffb70325" }}
              >
                <AcademicCapIcon size={10} color="#ffb703" />
                <Text
                  className="text-xs ml-1"
                  style={{ fontFamily: "CabinetGrotesk-Medium", color: "#ffb703" }}
                >
                  Practice
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Delete button + Score/status */}
        <View className="flex-row items-center">
          {onDelete && (
            <TouchableOpacity
              onPress={handleDelete}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="mr-3 p-2 rounded-full"
              style={{ backgroundColor: "#fb850020" }}
            >
              <TrashIcon size={16} color="#fb8500" />
            </TouchableOpacity>
          )}
          {hasAnalysis && score > 0 ? (
            <View className="flex-row items-center">
              <View
                className="px-3 py-1.5 rounded-full mr-2"
                style={{ backgroundColor: scoreColor + "20" }}
              >
                <Text
                  style={{
                    fontFamily: "CabinetGrotesk-Bold",
                    color: scoreColor,
                    fontSize: 14,
                  }}
                >
                  {score}/10
                </Text>
              </View>
              <ChevronRightIcon size={20} color="#8ecae6" />
            </View>
          ) : (
            <View className="flex-row items-center">
              <View
                className="px-2 py-1 rounded-full mr-1"
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
              <ChevronRightIcon size={20} color="#8ecae6" />
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
