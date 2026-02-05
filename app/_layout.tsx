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
    "Satoshi-Regular": require("../Satoshi_Complete/Fonts/TTF/Satoshi-Variable.ttf"),
    "Satoshi-Medium": require("../Satoshi_Complete/Fonts/OTF/Satoshi-Medium.otf"),
    "Satoshi-Bold": require("../Satoshi_Complete/Fonts/OTF/Satoshi-Bold.otf"),
    "Satoshi-Light": require("../Satoshi_Complete/Fonts/OTF/Satoshi-Light.otf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#edf6f9" }}>
        <ActivityIndicator size="large" color="#006d77" />
        <Text style={{ marginTop: 16, color: "#006d77" }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: "#006d77",
            },
            headerTintColor: "#ffffff",
            headerTitleStyle: {
              fontFamily: "Satoshi-Bold",
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
