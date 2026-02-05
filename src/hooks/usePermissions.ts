import { useState, useEffect, useCallback } from "react";
import { Audio } from "expo-av";

interface PermissionsState {
  hasPermission: boolean | null;
  isLoading: boolean;
  error: string | null;
}

export function usePermissions() {
  const [state, setState] = useState<PermissionsState>({
    hasPermission: null,
    isLoading: true,
    error: null,
  });

  const checkPermission = useCallback(async () => {
    try {
      const { status } = await Audio.getPermissionsAsync();
      setState({
        hasPermission: status === "granted",
        isLoading: false,
        error: null,
      });
      return status === "granted";
    } catch (error) {
      setState({
        hasPermission: false,
        isLoading: false,
        error: "Failed to check microphone permission",
      });
      return false;
    }
  }, []);

  const requestPermission = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setState({
        hasPermission: status === "granted",
        isLoading: false,
        error: status === "granted" ? null : "Microphone permission denied",
      });
      return status === "granted";
    } catch (error) {
      setState({
        hasPermission: false,
        isLoading: false,
        error: "Failed to request microphone permission",
      });
      return false;
    }
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    hasPermission: state.hasPermission,
    isLoading: state.isLoading,
    error: state.error,
    checkPermission,
    requestPermission,
  };
}
