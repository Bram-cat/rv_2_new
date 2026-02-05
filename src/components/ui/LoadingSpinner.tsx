import { View, Text, ActivityIndicator } from "react-native";

interface LoadingSpinnerProps {
  size?: "small" | "large";
  message?: string;
  color?: string;
}

export function LoadingSpinner({
  size = "large",
  message,
  color = "#006d77",
}: LoadingSpinnerProps) {
  return (
    <View className="items-center justify-center py-8">
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text className="text-primary-dark mt-3 text-center">{message}</Text>
      )}
    </View>
  );
}
