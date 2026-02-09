import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "react-native-heroicons/solid";

type AlertType = "info" | "success" | "error" | "warning";

interface AlertButton {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

interface AlertConfig {
  title: string;
  message: string;
  type?: AlertType;
  buttons?: AlertButton[];
}

interface AlertContextValue {
  showAlert: (config: AlertConfig) => void;
}

const AlertContext = createContext<AlertContextValue>({
  showAlert: () => {},
});

export const useThemedAlert = () => useContext(AlertContext);

export function ThemedAlertProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig | null>(null);

  const showAlert = useCallback((cfg: AlertConfig) => {
    setConfig(cfg);
    setVisible(true);
  }, []);

  const handlePress = useCallback((button?: AlertButton) => {
    setVisible(false);
    if (button?.onPress) {
      setTimeout(button.onPress, 150);
    }
  }, []);

  const type = config?.type || "info";
  const buttons = config?.buttons || [
    { text: "OK", style: "default" as const },
  ];

  const iconColor =
    type === "success"
      ? "#22c55e"
      : type === "error"
        ? "#ef4444"
        : type === "warning"
          ? "#fb8500"
          : "#8ecae6";

  const IconComponent =
    type === "success"
      ? CheckCircleIcon
      : type === "error"
        ? XCircleIcon
        : type === "warning"
          ? ExclamationTriangleIcon
          : null;

  const primaryColor = type === "success" ? "#22c55e" : "#ffb703";

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => handlePress()}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => handlePress()}
        >
          <TouchableOpacity activeOpacity={1} style={styles.card}>
            {IconComponent && (
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: iconColor + "20" },
                ]}
              >
                <IconComponent size={32} color={iconColor} />
              </View>
            )}
            <Text style={styles.title}>{config?.title}</Text>
            <Text style={styles.message}>{config?.message}</Text>
            <View
              style={[
                styles.buttonContainer,
                buttons.length > 1 && styles.buttonRow,
              ]}
            >
              {buttons.map((btn, i) => {
                const isCancel = btn.style === "cancel";
                const isDestructive = btn.style === "destructive";
                const bg = isCancel
                  ? "transparent"
                  : isDestructive
                    ? "#fb8500"
                    : primaryColor;
                const textColor = isCancel
                  ? "#8ecae6"
                  : isDestructive
                    ? "#fff"
                    : "#023047";

                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => handlePress(btn)}
                    style={[
                      styles.button,
                      { backgroundColor: bg },
                      isCancel && styles.cancelButton,
                      buttons.length > 1 && { flex: 1 },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.buttonText, { color: textColor }]}>
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </AlertContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: "#011627",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    borderWidth: 1,
    borderColor: "#034569",
    alignItems: "center",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: "CabinetGrotesk-Bold",
    fontSize: 20,
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontFamily: "CabinetGrotesk-Regular",
    fontSize: 14,
    color: "#8ecae6",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  buttonRow: {
    flexDirection: "row",
  },
  button: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#034569",
  },
  buttonText: {
    fontFamily: "CabinetGrotesk-Bold",
    fontSize: 15,
  },
});
