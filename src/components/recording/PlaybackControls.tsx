import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDuration } from "../../utils/formatters";

interface PlaybackControlsProps {
  isPlaying: boolean;
  isLoaded: boolean;
  currentTime: number; // milliseconds
  duration: number; // milliseconds
  onPlayPause: () => void;
  onSeek?: (position: number) => void;
}

export function PlaybackControls({
  isPlaying,
  isLoaded,
  currentTime,
  duration,
  onPlayPause,
}: PlaybackControlsProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <View className="w-full">
      {/* Progress bar */}
      <View className="h-2 bg-secondary-light rounded-full overflow-hidden mb-2">
        <View
          className="h-full bg-primary rounded-full"
          style={{ width: `${progress}%` }}
        />
      </View>

      {/* Time labels */}
      <View className="flex-row justify-between mb-4">
        <Text className="text-xs text-secondary-dark">
          {formatDuration(currentTime)}
        </Text>
        <Text className="text-xs text-secondary-dark">{formatDuration(duration)}</Text>
      </View>

      {/* Play/Pause button */}
      <View className="items-center">
        <TouchableOpacity
          onPress={onPlayPause}
          disabled={!isLoaded}
          className={`w-14 h-14 rounded-full items-center justify-center ${
            isLoaded ? "bg-primary" : "bg-secondary"
          }`}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={24}
            color="#ffffff"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
