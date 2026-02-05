import { TouchableOpacity, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface RecordButtonProps {
  isRecording: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function RecordButton({
  isRecording,
  onPress,
  disabled,
}: RecordButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className="items-center"
      activeOpacity={0.8}
    >
      <View className="relative items-center justify-center">
        {/* Outer ring - always visible */}
        <View
          className={`absolute w-36 h-36 rounded-full border-4 ${
            isRecording ? "border-accent" : "border-secondary"
          }`}
        />

        {/* Pulse rings when recording */}
        {isRecording && (
          <>
            <View className="absolute w-32 h-32 rounded-full bg-accent opacity-20" />
            <View className="absolute w-28 h-28 rounded-full bg-accent opacity-30" />
          </>
        )}

        {/* Main button */}
        <View
          className={`w-24 h-24 rounded-full items-center justify-center shadow-xl ${
            isRecording ? "bg-accent" : "bg-primary"
          } ${disabled && !isRecording ? "opacity-50" : ""}`}
        >
          {isRecording ? (
            // Recording indicator
            <View className="w-8 h-8 rounded-sm bg-white" />
          ) : (
            // Microphone icon
            <Ionicons name="mic-outline" size={40} color="#ffffff" />
          )}
        </View>
      </View>

      {/* Label */}
      <Text className="mt-6 text-lg text-primary-dark font-semibold">
        {isRecording ? "Recording..." : "Tap to Start"}
      </Text>
      {!isRecording && !disabled && (
        <Text className="text-sm text-secondary-dark mt-1">
          Speak clearly into your microphone
        </Text>
      )}
    </TouchableOpacity>
  );
}
