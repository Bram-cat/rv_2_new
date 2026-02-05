import { View, Text } from "react-native";

interface ProgressBarProps {
  value?: number; // 0-100
  progress?: number; // alias for value
  label?: string;
  showPercentage?: boolean;
  color?: "blue" | "green" | "yellow" | "red" | "purple";
  size?: "small" | "medium" | "large";
}

export function ProgressBar({
  value,
  progress,
  label,
  showPercentage = true,
  color = "blue",
  size = "medium",
}: ProgressBarProps) {
  const colorStyles = {
    blue: "#219ebc",
    green: "#22c55e",
    yellow: "#ffb703",
    red: "#fb8500",
    purple: "#a855f7",
  };

  const sizeStyles = {
    small: 4,
    medium: 8,
    large: 12,
  };

  const actualValue = value ?? progress ?? 0;
  const clampedValue = Math.min(100, Math.max(0, actualValue));

  return (
    <View className="w-full">
      {(label || showPercentage) && (
        <View className="flex-row justify-between mb-1">
          {label && (
            <Text
              className="text-sm"
              style={{
                fontFamily: "CabinetGrotesk-Light",
                color: "#8ecae6",
              }}
            >
              {label}
            </Text>
          )}
          {showPercentage && (
            <Text
              className="text-sm"
              style={{
                fontFamily: "CabinetGrotesk-Medium",
                color: "#ffffff",
              }}
            >
              {Math.round(clampedValue)}%
            </Text>
          )}
        </View>
      )}
      <View
        className="rounded-full overflow-hidden"
        style={{
          backgroundColor: "#011627",
          height: sizeStyles[size],
        }}
      >
        <View
          className="h-full rounded-full"
          style={{
            width: `${clampedValue}%`,
            backgroundColor: colorStyles[color],
          }}
        />
      </View>
    </View>
  );
}
