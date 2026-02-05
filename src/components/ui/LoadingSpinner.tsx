import { View, Text, ActivityIndicator } from "react-native";

interface LoadingSpinnerProps {
  size?: "small" | "large";
  message?: string;
  color?: string;
}

export function LoadingSpinner({
  size = "large",
  message,
  color = "#ffb703",
}: LoadingSpinnerProps) {
  return (
    <View className="items-center justify-center py-8">
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text
          className="mt-3 text-center"
          style={{
            fontFamily: "CabinetGrotesk-Light",
            color: "#8ecae6",
          }}
        >
          {message}
        </Text>
      )}
    </View>
  );
}
