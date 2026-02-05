import "../global.css";
import { View, Text, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";

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
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#023047" }}>
        <ActivityIndicator size="large" color="#ffb703" />
        <Text style={{ marginTop: 16, color: "#8ecae6" }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
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
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="analysis/[id]"
            options={{
              title: "Analysis",
              presentation: "card",
            }}
          />
          <Stack.Screen
            name="history"
            options={{
              title: "History",
              presentation: "card",
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </View>
  );
}
