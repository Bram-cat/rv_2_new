import { Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
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
      </View>
    );
  }

  // If not signed in, show sign-in screen
  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  // If signed in, go to tabs
  return <Redirect href="/(tabs)" />;
}
