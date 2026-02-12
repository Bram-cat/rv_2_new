import "../global.css";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "../src/services/auth/tokenCache";
import {
  initRevenueCat,
  identifyUser,
} from "../src/services/paywall/revenueCat";
import { ThemedAlertProvider } from "../src/components/ui/ThemedAlert";

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

// Prevent auto-hiding splash screen
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "CabinetGrotesk-Thin": require("../CabinetGrotesk_Complete/Fonts/OTF/CabinetGrotesk-Thin.otf"),
    "CabinetGrotesk-Extralight": require("../CabinetGrotesk_Complete/Fonts/OTF/CabinetGrotesk-Extralight.otf"),
    "CabinetGrotesk-Light": require("../CabinetGrotesk_Complete/Fonts/OTF/CabinetGrotesk-Light.otf"),
    "CabinetGrotesk-Regular": require("../CabinetGrotesk_Complete/Fonts/OTF/CabinetGrotesk-Regular.otf"),
    "CabinetGrotesk-Medium": require("../CabinetGrotesk_Complete/Fonts/OTF/CabinetGrotesk-Medium.otf"),
    "CabinetGrotesk-Bold": require("../CabinetGrotesk_Complete/Fonts/OTF/CabinetGrotesk-Bold.otf"),
    "CabinetGrotesk-Extrabold": require("../CabinetGrotesk_Complete/Fonts/OTF/CabinetGrotesk-Extrabold.otf"),
    "CabinetGrotesk-Black": require("../CabinetGrotesk_Complete/Fonts/OTF/CabinetGrotesk-Black.otf"),
  });

  if (!fontsLoaded && !fontError) {
    return null; // Keep native splash screen visible
  }

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <View style={{ flex: 1, backgroundColor: "#023047" }}>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <ThemedAlertProvider>
            <AppNavigator fontsReady={fontsLoaded || !!fontError} />
          </ThemedAlertProvider>
        </SafeAreaProvider>
      </View>
    </ClerkProvider>
  );
}

function AppNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { userId, isLoaded } = useAuth();

  // Hide splash screen only when both fonts AND Clerk are ready
  useEffect(() => {
    if (fontsReady && isLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsReady, isLoaded]);

  // Initialize RevenueCat once
  useEffect(() => {
    initRevenueCat();
  }, []);

  // Identify user with RevenueCat when auth changes
  useEffect(() => {
    if (userId) {
      identifyUser(userId);
    }
  }, [userId]);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#023047",
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontFamily: "CabinetGrotesk-Bold",
          fontWeight: "600",
        },
        animation: "slide_from_right",
        animationDuration: 300,
        animationTypeForReplace: "push",
        gestureEnabled: true,
        gestureDirection: "horizontal",
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="analysis/[id]"
        options={{
          title: "Analysis",
          presentation: "card",
          animation: "slide_from_bottom",
          animationDuration: 300,
        }}
      />
      <Stack.Screen
        name="history"
        options={{
          title: "History",
          presentation: "card",
          animation: "slide_from_right",
          animationDuration: 250,
        }}
      />
      <Stack.Screen
        name="practice/free"
        options={{
          headerShown: false,
          animation: "slide_from_right",
          animationDuration: 250,
        }}
      />
      <Stack.Screen
        name="practice/templates"
        options={{
          headerShown: false,
          animation: "slide_from_right",
          animationDuration: 250,
        }}
      />
      <Stack.Screen
        name="practice/record/structured"
        options={{
          headerShown: false,
          animation: "slide_from_right",
          animationDuration: 250,
        }}
      />
      <Stack.Screen
        name="practice/record/challenge"
        options={{
          headerShown: false,
          animation: "slide_from_right",
          animationDuration: 250,
        }}
      />
      <Stack.Screen
        name="paywall"
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
          animationDuration: 300,
        }}
      />
      <Stack.Screen
        name="sign-in"
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
          animationDuration: 300,
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          headerShown: false,
          presentation: "card",
          animation: "slide_from_right",
          animationDuration: 300,
          gestureEnabled: true,
          gestureDirection: "horizontal",
          animationTypeForReplace: "push",
        }}
      />
    </Stack>
  );
}
