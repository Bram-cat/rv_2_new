import { Tabs, useRouter } from "expo-router";
import { View, TouchableOpacity, Image } from "react-native";
import { useState } from "react";
import {
  HomeIcon,
  AcademicCapIcon,
  DocumentTextIcon,
} from "react-native-heroicons/outline";
import {
  HomeIcon as HomeIconSolid,
  AcademicCapIcon as AcademicCapIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
} from "react-native-heroicons/solid";
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
            tabBarIcon: ({ color, focused }) =>
              focused ? (
                <HomeIconSolid size={24} color={color} />
              ) : (
                <HomeIcon size={24} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="practice"
          options={{
            title: "Practice",
            headerShown: false,
            tabBarIcon: ({ color, focused }) =>
              focused ? (
                <AcademicCapIconSolid size={24} color={color} />
              ) : (
                <AcademicCapIcon size={24} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="record"
          options={{
            title: "Record",
            headerShown: false,
            tabBarButton: () => (
              <TouchableOpacity
                onPress={handleRecordPress}
                activeOpacity={0.8}
                style={{
                  top: -20,
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
            tabBarIcon: ({ color, focused }) =>
              focused ? (
                <DocumentTextIconSolid size={24} color={color} />
              ) : (
                <DocumentTextIcon size={24} color={color} />
              ),
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
