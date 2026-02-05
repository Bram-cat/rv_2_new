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
        className={`text-6xl font-bold tracking-tight ${
          isWarning ? "text-accent-dark" : "text-primary-dark"
        }`}
      >
        {formatDuration(durationMs)}
      </Text>

      {/* Progress bar */}
      <View className="w-48 h-2 bg-secondary-light rounded-full mt-4 overflow-hidden">
        <View
          className={`h-full rounded-full ${
            isWarning ? "bg-accent" : "bg-primary"
          }`}
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </View>

      {/* Remaining time */}
      {showRemaining && (
        <Text
          className={`text-sm mt-2 ${
            isWarning ? "text-accent font-semibold" : "text-secondary-dark"
          }`}
        >
          {isWarning
            ? `${formatDuration(remaining)} remaining`
            : `Max: ${formatDuration(maxDurationMs)}`}
        </Text>
      )}
    </View>
  );
}
