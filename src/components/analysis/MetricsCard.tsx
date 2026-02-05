import { View, Text } from "react-native";
import { ProgressBar } from "../ui/ProgressBar";

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  progress?: number; // 0-100
  progressColor?: "blue" | "green" | "yellow" | "red" | "purple";
  icon?: React.ReactNode;
}

export function MetricsCard({
  title,
  value,
  subtitle,
  progress,
  progressColor = "blue",
  icon,
}: MetricsCardProps) {
  return (
    <View className="bg-background-card rounded-2xl p-4 shadow-sm mb-3 border border-secondary-light">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-sm text-secondary-dark mb-1">{title}</Text>
          <Text className="text-2xl font-bold text-primary-dark">{value}</Text>
          {subtitle && (
            <Text className="text-xs text-secondary mt-1">{subtitle}</Text>
          )}
        </View>
        {icon && <View className="ml-3">{icon}</View>}
      </View>

      {progress !== undefined && (
        <View className="mt-3">
          <ProgressBar
            value={progress}
            showPercentage={false}
            color={progressColor}
            size="small"
          />
        </View>
      )}
    </View>
  );
}
