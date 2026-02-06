import { View, Animated, Easing } from "react-native";
import { useEffect, useRef, useState } from "react";

interface VoiceVisualizerProps {
  isRecording: boolean;
  audioLevel?: number; // 0-1 representing volume
  isPaused?: boolean;
}

export function VoiceVisualizer({
  isRecording,
  audioLevel = 0.5,
  isPaused = false,
}: VoiceVisualizerProps) {
  // Multiple animated rings
  const ring1Scale = useRef(new Animated.Value(1)).current;
  const ring2Scale = useRef(new Animated.Value(1)).current;
  const ring3Scale = useRef(new Animated.Value(1)).current;
  const ring1Opacity = useRef(new Animated.Value(0.3)).current;
  const ring2Opacity = useRef(new Animated.Value(0.2)).current;
  const ring3Opacity = useRef(new Animated.Value(0.1)).current;

  // Breathing animation for idle state
  const breatheScale = useRef(new Animated.Value(1)).current;

  // Simulated audio levels when not receiving real data
  const [simulatedLevel, setSimulatedLevel] = useState(0.3);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRecording && !isPaused) {
      // Simulate varying audio levels for visual effect
      interval = setInterval(() => {
        setSimulatedLevel(0.3 + Math.random() * 0.7);
      }, 150);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isPaused]);

  useEffect(() => {
    if (isRecording && !isPaused) {
      const level = audioLevel || simulatedLevel;

      // Animate rings based on audio level
      Animated.parallel([
        Animated.timing(ring1Scale, {
          toValue: 1 + level * 0.3,
          duration: 100,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ring2Scale, {
          toValue: 1 + level * 0.5,
          duration: 150,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ring3Scale, {
          toValue: 1 + level * 0.7,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ring1Opacity, {
          toValue: 0.4 + level * 0.3,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(ring2Opacity, {
          toValue: 0.3 + level * 0.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(ring3Opacity, {
          toValue: 0.2 + level * 0.1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset to base state
      Animated.parallel([
        Animated.timing(ring1Scale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(ring2Scale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(ring3Scale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(ring1Opacity, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(ring2Opacity, {
          toValue: 0.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(ring3Opacity, {
          toValue: 0.1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isRecording, isPaused, audioLevel, simulatedLevel]);

  // Breathing animation for non-recording state
  useEffect(() => {
    if (!isRecording) {
      const breatheAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(breatheScale, {
            toValue: 1.05,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(breatheScale, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      breatheAnimation.start();
      return () => breatheAnimation.stop();
    } else {
      breatheScale.setValue(1);
    }
  }, [isRecording]);

  const baseSize = 180;

  return (
    <View
      style={{
        width: baseSize + 80,
        height: baseSize + 80,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Outer ring 3 */}
      <Animated.View
        style={{
          position: "absolute",
          width: baseSize + 60,
          height: baseSize + 60,
          borderRadius: (baseSize + 60) / 2,
          backgroundColor: isRecording ? "#fb8500" : "#219ebc",
          opacity: ring3Opacity,
          transform: [
            { scale: isRecording ? ring3Scale : breatheScale },
          ],
        }}
      />

      {/* Outer ring 2 */}
      <Animated.View
        style={{
          position: "absolute",
          width: baseSize + 40,
          height: baseSize + 40,
          borderRadius: (baseSize + 40) / 2,
          backgroundColor: isRecording ? "#fb8500" : "#219ebc",
          opacity: ring2Opacity,
          transform: [{ scale: isRecording ? ring2Scale : breatheScale }],
        }}
      />

      {/* Outer ring 1 */}
      <Animated.View
        style={{
          position: "absolute",
          width: baseSize + 20,
          height: baseSize + 20,
          borderRadius: (baseSize + 20) / 2,
          backgroundColor: isRecording ? "#fb8500" : "#219ebc",
          opacity: ring1Opacity,
          transform: [{ scale: isRecording ? ring1Scale : breatheScale }],
        }}
      />

      {/* Main circle border */}
      <View
        style={{
          position: "absolute",
          width: baseSize,
          height: baseSize,
          borderRadius: baseSize / 2,
          borderWidth: 4,
          borderColor: isRecording ? "#fb8500" : "#219ebc",
        }}
      />

      {/* Inner glow */}
      <View
        style={{
          position: "absolute",
          width: baseSize - 20,
          height: baseSize - 20,
          borderRadius: (baseSize - 20) / 2,
          backgroundColor: isRecording ? "#fb850015" : "#219ebc15",
        }}
      />
    </View>
  );
}
