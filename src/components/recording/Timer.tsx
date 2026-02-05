import { View, Text } from "react-native";
import { formatDuration } from "../../utils/formatters";
import { RECORDING_CONFIG } from "../../constants/thresholds";

interface TimerProps {
  durationMs: number;
  maxDurationMs?: number;
  showRemaining?: boolean;
}

export function Timer({
  durationMs,
  maxDurationMs = RECORDING_CONFIG.MAX_DURATION_MS,
  showRemaining = true,
}: TimerProps) {
  const remaining = maxDurationMs - durationMs;
  const isWarning = remaining <= RECORDING_CONFIG.WARNING_THRESHOLD_MS;
  const progress = (durationMs / maxDurationMs) * 100;

  return (
    <View className="items-center">
      {/* Main timer display */}
      <Text
        className="text-6xl tracking-tight"
        style={{
          fontFamily: "CabinetGrotesk-Bold",
          color: isWarning ? "#fb8500" : "#ffffff",
        }}
      >
        {formatDuration(durationMs)}
      </Text>

      {/* Progress bar */}
      <View
        className="w-48 h-2 rounded-full mt-4 overflow-hidden"
        style={{ backgroundColor: "#034569" }}
      >
        <View
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, progress)}%`,
            backgroundColor: isWarning ? "#fb8500" : "#ffb703",
          }}
        />
      </View>

      {/* Remaining time */}
      {showRemaining && (
        <Text
          className="text-sm mt-2"
          style={{
            fontFamily: isWarning
              ? "CabinetGrotesk-Medium"
              : "CabinetGrotesk-Light",
            color: isWarning ? "#fb8500" : "#8ecae6",
          }}
        >
          {isWarning
            ? `${formatDuration(remaining)} remaining`
            : `Max: ${formatDuration(maxDurationMs)}`}
        </Text>
      )}
    </View>
  );
}
