import "../global.css";
import { View, Text, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "../src/services/auth/tokenCache";
import { initRevenueCat, identifyUser } from "../src/services/paywall/revenueCat";
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

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#023047",
        }}
      >
        <ActivityIndicator size="large" color="#ffb703" />
        <Text style={{ marginTop: 16, color: "#8ecae6" }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ClerkLoaded>
        <View style={{ flex: 1 }}>
          <SafeAreaProvider>
            <StatusBar style="light" />
            <ThemedAlertProvider>
              <AppNavigator />
            </ThemedAlertProvider>
          </SafeAreaProvider>
        </View>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

function AppNavigator() {
  const { userId } = useAuth();

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
        animationDuration: 250,
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
          animationDuration: 250,
        }}
      />
    </Stack>
  );
}
