import { View, Text, TouchableOpacity, Image, Linking, Platform } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useState, useEffect } from "react";
import {
  ChevronLeftIcon,
  CreditCardIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  SparklesIcon,
} from "react-native-heroicons/outline";
import {
  checkProStatus,
  presentCustomerCenter,
  logoutUser,
} from "../src/services/paywall/revenueCat";
import { getAnalysisCount, FREE_LIMIT } from "../src/services/paywall/usage";
import { useThemedAlert } from "../src/components/ui/ThemedAlert";

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();
  const { showAlert } = useThemedAlert();
  const [isPro, setIsPro] = useState(false);
  const [usageCount, setUsageCount] = useState(0);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    const [pro, count] = await Promise.all([
      checkProStatus(),
      getAnalysisCount(),
    ]);
    setIsPro(pro);
    setUsageCount(count);
  };

  const handleSignOut = () => {
    showAlert({
      title: "Sign Out",
      message: "Are you sure you want to sign out?",
      type: "warning",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await logoutUser();
            await signOut();
            router.replace("/sign-in");
          },
        },
      ],
    });
  };

  const handleManageSubscription = async () => {
    try {
      await presentCustomerCenter();
    } catch {
      // Fallback: open platform subscription management
      const url = Platform.select({
        ios: "https://apps.apple.com/account/subscriptions",
        android: "https://play.google.com/store/account/subscriptions",
      });
      if (url) Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#023047" }}>
      <View className="flex-1 px-6 py-4">
        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center mb-8"
          activeOpacity={0.7}
        >
          <ChevronLeftIcon size={20} color="#8ecae6" />
          <Text
            className="ml-1"
            style={{ fontFamily: "CabinetGrotesk-Medium", color: "#8ecae6" }}
          >
            Back
          </Text>
        </TouchableOpacity>

        {/* Avatar & Info */}
        <View className="items-center mb-8">
          {user?.imageUrl ? (
            <Image
              source={{ uri: user.imageUrl }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                borderWidth: 3,
                borderColor: "#ffb703",
              }}
            />
          ) : (
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: "#034569",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserCircleIcon size={48} color="#8ecae6" />
            </View>
          )}
          <Text
            className="text-xl text-white mt-4"
            style={{ fontFamily: "CabinetGrotesk-Bold" }}
          >
            {user?.firstName
              ? `${user.firstName} ${user.lastName || ""}`.trim()
              : "Guest"}
          </Text>
          <Text
            className="text-sm mt-1"
            style={{ fontFamily: "CabinetGrotesk-Regular", color: "#8ecae6" }}
          >
            {user?.emailAddresses[0]?.emailAddress || "Not signed in"}
          </Text>
          {isPro && (
            <View
              className="mt-3 px-4 py-1.5 rounded-full"
              style={{ backgroundColor: "#ffb703" }}
            >
              <Text
                style={{
                  fontFamily: "CabinetGrotesk-Bold",
                  color: "#023047",
                  fontSize: 12,
                }}
              >
                PRO
              </Text>
            </View>
          )}
        </View>

        {/* Usage Stats */}
        <View
          className="rounded-2xl p-4 mb-6"
          style={{
            backgroundColor: "#011627",
            borderWidth: 1,
            borderColor: "#034569",
          }}
        >
          <Text
            className="text-white mb-2"
            style={{ fontFamily: "CabinetGrotesk-Medium" }}
          >
            Usage
          </Text>
          <Text
            className="text-sm"
            style={{ fontFamily: "CabinetGrotesk-Regular", color: "#8ecae6" }}
          >
            {isPro
              ? "Unlimited analyses (Pro)"
              : `${usageCount} / ${FREE_LIMIT} free analyses used`}
          </Text>
        </View>

        {/* Actions */}
        {!isPro && (
          <TouchableOpacity
            onPress={() => router.push("/paywall")}
            className="rounded-2xl p-4 mb-3 flex-row items-center"
            style={{ backgroundColor: "#ffb703" }}
            activeOpacity={0.8}
          >
            <SparklesIcon size={20} color="#023047" />
            <Text
              className="ml-3 flex-1"
              style={{ fontFamily: "CabinetGrotesk-Bold", color: "#023047" }}
            >
              Upgrade to Pro
            </Text>
          </TouchableOpacity>
        )}

        {isPro && (
          <TouchableOpacity
            onPress={handleManageSubscription}
            className="rounded-2xl p-4 mb-3 flex-row items-center"
            style={{
              backgroundColor: "#011627",
              borderWidth: 1,
              borderColor: "#034569",
            }}
            activeOpacity={0.7}
          >
            <CreditCardIcon size={20} color="#8ecae6" />
            <Text
              className="ml-3 flex-1 text-white"
              style={{ fontFamily: "CabinetGrotesk-Medium" }}
            >
              Manage Subscription
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handleSignOut}
          className="rounded-2xl p-4 mb-3 flex-row items-center"
          style={{
            backgroundColor: "#011627",
            borderWidth: 1,
            borderColor: "#fb8500",
          }}
          activeOpacity={0.7}
        >
          <ArrowRightOnRectangleIcon size={20} color="#fb8500" />
          <Text
            className="ml-3 flex-1"
            style={{ fontFamily: "CabinetGrotesk-Medium", color: "#fb8500" }}
          >
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
