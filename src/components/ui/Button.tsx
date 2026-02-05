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
  const baseStyles = "rounded-full items-center justify-center flex-row";

  const sizeStyles = {
    small: "px-4 py-2",
    medium: "px-6 py-3",
    large: "px-8 py-4",
  };

  const variantStyles = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    danger: "bg-accent",
    ghost: "bg-transparent border border-secondary",
  };

  const textSizeStyles = {
    small: "text-sm",
    medium: "text-base",
    large: "text-lg",
  };

  const textStyles = {
    primary: "text-white font-semibold",
    secondary: "text-primary-dark font-semibold",
    danger: "text-white font-semibold",
    ghost: "text-primary font-semibold",
  };

  const spinnerColor = variant === "secondary" || variant === "ghost" ? "#006d77" : "#ffffff";

  return (
    <TouchableOpacity
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
        disabled ? "opacity-50" : ""
      }`}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} size="small" />
      ) : (
        <View className="flex-row items-center">
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={`${textStyles[variant]} ${textSizeStyles[size]}`}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
