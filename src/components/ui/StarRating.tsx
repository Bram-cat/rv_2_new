import { View, Text } from "react-native";

interface StarRatingProps {
  rating: number; // 1-5
  maxRating?: number;
  size?: "small" | "medium" | "large";
  showLabel?: boolean;
  color?: string;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "medium",
  showLabel = false,
  color = "#facc15", // yellow-400
}: StarRatingProps) {
  const sizeStyles = {
    small: "text-lg",
    medium: "text-2xl",
    large: "text-4xl",
  };

  const labelSizeStyles = {
    small: "text-xs",
    medium: "text-sm",
    large: "text-base",
  };

  // Clamp rating between 0 and maxRating
  const clampedRating = Math.max(0, Math.min(maxRating, rating));

  return (
    <View className="flex-row items-center">
      <View className="flex-row">
        {Array.from({ length: maxRating }).map((_, index) => (
          <Text
            key={index}
            className={sizeStyles[size]}
            style={{ color: index < clampedRating ? color : "#d1d5db" }}
          >
            ★
          </Text>
        ))}
      </View>
      {showLabel && (
        <Text className={`ml-2 text-gray-600 ${labelSizeStyles[size]}`}>
          {clampedRating}/{maxRating}
        </Text>
      )}
    </View>
  );
}
