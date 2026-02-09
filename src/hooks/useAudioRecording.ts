import { useState, useCallback, useRef, useEffect } from "react";
import { Audio } from "expo-av";
import { RECORDING_CONFIG } from "../constants/thresholds";

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // milliseconds
  uri: string | null;
  error: string | null;
}

export function useAudioRecording() {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    uri: null,
    error: null,
  });

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const pauseStartTimeRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Stop any active recording
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(console.error);
      }
    };
  }, []);

  // Auto-stop at max duration
  useEffect(() => {
    if (state.isRecording && state.duration >= RECORDING_CONFIG.MAX_DURATION_MS) {
      stopRecording();
    }
  }, [state.duration, state.isRecording]);

  const startRecording = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null, uri: null }));

      // Request permissions
      let permResult;
      try {
        permResult = await Audio.requestPermissionsAsync();
      } catch (permError) {
        console.error("Permission request error:", permError);
        setState((prev) => ({
          ...prev,
          error: "Failed to request microphone permission",
          isRecording: false,
        }));
        return false;
      }

      if (permResult.status !== "granted") {
        setState((prev) => ({
          ...prev,
          error: "Microphone permission denied",
          isRecording: false,
        }));
        return false;
      }

      // Configure audio mode for recording
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      } catch (modeError) {
        console.error("Audio mode error:", modeError);
        // Retry once after a short delay
        await new Promise((r) => setTimeout(r, 200));
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      }

      // Create and prepare the recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      startTimeRef.current = Date.now();
      pausedDurationRef.current = 0;

      // Start duration timer
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current - pausedDurationRef.current;
        setState((prev) => {
          if (prev.isPaused) return prev;
          return { ...prev, duration: elapsed };
        });
      }, 100);

      setState((prev) => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0,
      }));

      console.log("Recording started successfully");
      return true;
    } catch (error) {
      console.error("Recording start error:", error);
      const message = error instanceof Error ? error.message : "Failed to start recording";
      setState((prev) => ({
        ...prev,
        error: message,
        isRecording: false,
      }));
      return false;
    }
  }, []);

  const pauseRecording = useCallback(async () => {
    try {
      if (recordingRef.current) {
        await recordingRef.current.pauseAsync();
        pauseStartTimeRef.current = Date.now();
        setState((prev) => ({
          ...prev,
          isPaused: true,
        }));
        console.log("Recording paused");
      }
    } catch (error) {
      console.error("Pause error:", error);
    }
  }, []);

  const resumeRecording = useCallback(async () => {
    try {
      if (recordingRef.current) {
        await recordingRef.current.startAsync();
        const pauseDuration = Date.now() - pauseStartTimeRef.current;
        pausedDurationRef.current += pauseDuration;
        setState((prev) => ({
          ...prev,
          isPaused: false,
        }));
        console.log("Recording resumed");
      }
    } catch (error) {
      console.error("Resume error:", error);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    try {
      // Stop the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (!recordingRef.current) {
        console.error("No active recording to stop");
        setState((prev) => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          error: "No active recording",
        }));
        return null;
      }

      // Stop and unload the recording
      await recordingRef.current.stopAndUnloadAsync();

      // Get the URI
      const uri = recordingRef.current.getURI();
      console.log("Recording stopped, URI:", uri);

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      // Clear the recording ref
      recordingRef.current = null;

      setState((prev) => ({
        ...prev,
        isRecording: false,
        isPaused: false,
        uri: uri,
      }));

      return uri;
    } catch (error) {
      console.error("Stop recording error:", error);
      const message = error instanceof Error ? error.message : "Failed to stop recording";
      setState((prev) => ({
        ...prev,
        error: message,
        isRecording: false,
        isPaused: false,
      }));
      return null;
    }
  }, []);

  const resetRecording = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {
        // Ignore errors when resetting
      }
      recordingRef.current = null;
    }

    pausedDurationRef.current = 0;
    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      uri: null,
      error: null,
    });
  }, []);

  return {
    isRecording: state.isRecording,
    isPaused: state.isPaused,
    duration: state.duration,
    uri: state.uri,
    error: state.error,
    isNearMaxDuration:
      state.duration >= RECORDING_CONFIG.MAX_DURATION_MS - RECORDING_CONFIG.WARNING_THRESHOLD_MS,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  };
}
