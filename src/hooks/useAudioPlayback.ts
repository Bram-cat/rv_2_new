import { useState, useCallback, useEffect, useRef } from "react";
import { Audio, AVPlaybackStatus } from "expo-av";

interface PlaybackState {
  isPlaying: boolean;
  isLoaded: boolean;
  currentTime: number; // milliseconds
  duration: number; // milliseconds
  error: string | null;
}

export function useAudioPlayback(audioUri: string | null) {
  const [state, setState] = useState<PlaybackState>({
    isPlaying: false,
    isLoaded: false,
    currentTime: 0,
    duration: 0,
    error: null,
  });

  const soundRef = useRef<Audio.Sound | null>(null);

  // Load audio when URI changes
  useEffect(() => {
    let isMounted = true;

    async function loadAudio() {
      // Unload previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      if (!audioUri) {
        setState({
          isPlaying: false,
          isLoaded: false,
          currentTime: 0,
          duration: 0,
          error: null,
        });
        return;
      }

      try {
        const { sound, status } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: false },
          onPlaybackStatusUpdate
        );

        if (!isMounted) {
          await sound.unloadAsync();
          return;
        }

        soundRef.current = sound;

        if (status.isLoaded) {
          setState((prev) => ({
            ...prev,
            isLoaded: true,
            duration: status.durationMillis || 0,
            error: null,
          }));
        }
      } catch (error) {
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            error: error instanceof Error ? error.message : "Failed to load audio",
            isLoaded: false,
          }));
        }
      }
    }

    loadAudio();

    return () => {
      isMounted = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(console.error);
      }
    };
  }, [audioUri]);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setState((prev) => ({
        ...prev,
        isPlaying: status.isPlaying,
        isLoaded: true,
        currentTime: status.positionMillis || 0,
        duration: status.durationMillis || prev.duration,
      }));

      // Reset when playback finishes
      if (status.didJustFinish) {
        setState((prev) => ({
          ...prev,
          isPlaying: false,
          currentTime: 0,
        }));
      }
    }
  }, []);

  const play = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.playAsync();
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Failed to play",
      }));
    }
  }, []);

  const pause = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Failed to pause",
      }));
    }
  }, []);

  const seekTo = useCallback(async (positionMs: number) => {
    try {
      if (soundRef.current) {
        await soundRef.current.setPositionAsync(positionMs);
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Failed to seek",
      }));
    }
  }, []);

  const togglePlayback = useCallback(async () => {
    if (state.isPlaying) {
      await pause();
    } else {
      // If at end, seek to beginning first
      if (state.currentTime >= state.duration && state.duration > 0) {
        await seekTo(0);
      }
      await play();
    }
  }, [state.isPlaying, state.currentTime, state.duration, play, pause, seekTo]);

  return {
    isPlaying: state.isPlaying,
    isLoaded: state.isLoaded,
    currentTime: state.currentTime,
    duration: state.duration,
    error: state.error,
    progress: state.duration > 0 ? state.currentTime / state.duration : 0,
    play,
    pause,
    seekTo,
    togglePlayback,
  };
}
