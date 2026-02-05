import { View, Text } from "react-native";

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  color?: "blue" | "green" | "yellow" | "red" | "purple";
  size?: "small" | "medium" | "large";
}

export function ProgressBar({
  value,
  label,
  showPercentage = true,
  color = "blue",
  size = "medium",
}: ProgressBarProps) {
  const colorStyles = {
    blue: "bg-primary-600",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
    purple: "bg-purple-500",
  };

  const sizeStyles = {
    small: "h-1",
    medium: "h-2",
    large: "h-3",
  };

  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <View className="w-full">
      {(label || showPercentage) && (
        <View className="flex-row justify-between mb-1">
          {label && <Text className="text-sm text-gray-600">{label}</Text>}
          {showPercentage && (
            <Text className="text-sm font-semibold text-gray-800">
              {Math.round(clampedValue)}%
            </Text>
          )}
        </View>
      )}
      <View
        className={`bg-gray-200 rounded-full overflow-hidden ${sizeStyles[size]}`}
      >
        <View
          className={`h-full ${colorStyles[color]} rounded-full`}
          style={{ width: `${clampedValue}%` }}
        />
      </View>
    </View>
  );
}
