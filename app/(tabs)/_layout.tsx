import { Tabs, useRouter } from "expo-router";
import { View, TouchableOpacity, Image } from "react-native";
import { useState } from "react";
import {
  SpeechContextModal,
  SpeechContext,
} from "../../src/components/modals/SpeechContextModal";

// Import the custom middle icon
const middleIcon = require("../../assets/middle_icon.png");

// Store speech context globally for the record screen to access
export let currentSpeechContext: SpeechContext | null = null;

export default function TabLayout() {
  const router = useRouter();
  const [showContextModal, setShowContextModal] = useState(false);

  const handleRecordPress = () => {
    setShowContextModal(true);
  };

  const handleContextSubmit = (context: SpeechContext) => {
    currentSpeechContext = context;
    setShowContextModal(false);
    router.push("/(tabs)/record");
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#ffb703",
          tabBarInactiveTintColor: "#8ecae6",
          tabBarStyle: {
            backgroundColor: "#011627",
            borderTopColor: "#034569",
            borderTopWidth: 1,
            paddingBottom: 8,
            paddingTop: 8,
            height: 70,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontFamily: "CabinetGrotesk-Medium",
            marginTop: 4,
          },
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
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            headerShown: false,
            href: null,
          }}
        />
        <Tabs.Screen
          name="record"
          options={{
            title: "Record",
            headerShown: false,
            tabBarStyle: { display: "none" },
            tabBarButton: () => (
              <TouchableOpacity
                onPress={handleRecordPress}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    backgroundColor: "#ffb703",
                    width: 68,
                    height: 68,
                    borderRadius: 34,
                    justifyContent: "center",
                    alignItems: "center",
                    shadowColor: "#ffb703",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.5,
                    shadowRadius: 12,
                    elevation: 10,
                    borderWidth: 4,
                    borderColor: "#011627",
                    overflow: "hidden",
                    top: -20,
                  }}
                >
                  <Image
                    source={middleIcon}
                    style={{
                      width: 100,
                      height: 100,
                    }}
                    resizeMode="contain"
                  />
                </View>
              </TouchableOpacity>
            ),
          }}
        />
        <Tabs.Screen
          name="ppt-analyzer"
          options={{
            title: "Slides",
            headerShown: false,
            href: null,
          }}
        />
      </Tabs>

      <SpeechContextModal
        visible={showContextModal}
        onClose={() => setShowContextModal(false)}
        onSubmit={handleContextSubmit}
      />
    </>
  );
}
