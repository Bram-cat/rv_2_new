import { TouchableOpacity, View, Text } from "react-native";
import { MicrophoneIcon } from "react-native-heroicons/outline";

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
          className="absolute w-36 h-36 rounded-full border-4"
          style={{
            borderColor: isRecording ? "#fb8500" : "#219ebc",
          }}
        />

        {/* Pulse rings when recording */}
        {isRecording && (
          <>
            <View
              className="absolute w-32 h-32 rounded-full opacity-20"
              style={{ backgroundColor: "#fb8500" }}
            />
            <View
              className="absolute w-28 h-28 rounded-full opacity-30"
              style={{ backgroundColor: "#fb8500" }}
            />
          </>
        )}

        {/* Main button */}
        <View
          className={`w-24 h-24 rounded-full items-center justify-center ${
            disabled && !isRecording ? "opacity-50" : ""
          }`}
          style={{
            backgroundColor: isRecording ? "#fb8500" : "#ffb703",
            shadowColor: isRecording ? "#fb8500" : "#ffb703",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.5,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          {isRecording ? (
            // Recording indicator
            <View className="w-8 h-8 rounded-sm bg-white" />
          ) : (
            // Microphone icon
            <MicrophoneIcon size={40} color="#023047" strokeWidth={2} />
          )}
        </View>
      </View>

      {/* Label */}
      <Text
        className="mt-6 text-lg text-white"
        style={{ fontFamily: "CabinetGrotesk-Medium" }}
      >
        {isRecording ? "Recording..." : "Tap to Start"}
      </Text>
      {!isRecording && !disabled && (
        <Text
          className="text-sm text-secondary-light mt-1"
          style={{ fontFamily: "CabinetGrotesk-Light" }}
        >
          Speak clearly into your microphone
        </Text>
      )}
    </TouchableOpacity>
  );
}
