import { TouchableOpacity, Text, ActivityIndicator, View } from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled,
  loading,
  icon,
}: ButtonProps) {
  const sizeStyles = {
    small: { paddingHorizontal: 16, paddingVertical: 8 },
    medium: { paddingHorizontal: 24, paddingVertical: 12 },
    large: { paddingHorizontal: 32, paddingVertical: 16 },
  };

  const variantColors = {
    primary: "#ffb703",
    secondary: "#219ebc",
    danger: "#fb8500",
    ghost: "transparent",
  };

  const textColors = {
    primary: "#023047",
    secondary: "#ffffff",
    danger: "#ffffff",
    ghost: "#ffb703",
  };

  const textSizeStyles = {
    small: 14,
    medium: 16,
    large: 18,
  };

  const spinnerColor =
    variant === "ghost" ? "#ffb703" : variant === "primary" ? "#023047" : "#ffffff";

  return (
    <TouchableOpacity
      style={[
        {
          borderRadius: 50,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          backgroundColor: variantColors[variant],
          borderWidth: variant === "ghost" ? 1 : 0,
          borderColor: variant === "ghost" ? "#219ebc" : "transparent",
          opacity: disabled ? 0.5 : 1,
          shadowColor: variantColors[variant],
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: variant === "ghost" ? 0 : 0.3,
          shadowRadius: 8,
          elevation: variant === "ghost" ? 0 : 4,
        },
        sizeStyles[size],
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} size="small" />
      ) : (
        <View className="flex-row items-center">
          {icon && <View className="mr-2">{icon}</View>}
          <Text
            style={{
              fontFamily: "CabinetGrotesk-Medium",
              fontSize: textSizeStyles[size],
              color: textColors[variant],
            }}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
