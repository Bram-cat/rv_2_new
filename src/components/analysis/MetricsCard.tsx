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
    <View
      className="rounded-2xl p-4 mb-3 border"
      style={{
        backgroundColor: "#034569",
        borderColor: "#21628830",
      }}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text
            className="text-sm mb-1"
            style={{
              fontFamily: "CabinetGrotesk-Light",
              color: "#8ecae6",
            }}
          >
            {title}
          </Text>
          <Text
            className="text-2xl"
            style={{
              fontFamily: "CabinetGrotesk-Bold",
              color: "#ffffff",
            }}
          >
            {value}
          </Text>
          {subtitle && (
            <Text
              className="text-xs mt-1"
              style={{
                fontFamily: "CabinetGrotesk-Light",
                color: "#6bb8d4",
              }}
            >
              {subtitle}
            </Text>
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
