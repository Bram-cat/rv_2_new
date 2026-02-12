import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import {
  SparklesIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
} from "react-native-heroicons/outline";
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  initRevenueCat,
} from "../src/services/paywall/revenueCat";
import { FREE_LIMIT, resetAnalysisCount } from "../src/services/paywall/usage";
import { useThemedAlert } from "../src/components/ui/ThemedAlert";
import type { PurchasesPackage } from "react-native-purchases";

export default function PaywallScreen() {
  const router = useRouter();
  const { showAlert } = useThemedAlert();
  const [loading, setLoading] = useState(true);
  const [monthlyPkg, setMonthlyPkg] = useState<PurchasesPackage | null>(null);
  const [yearlyPkg, setYearlyPkg] = useState<PurchasesPackage | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"yearly" | "monthly">(
    "yearly",
  );
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [offeringsError, setOfferingsError] = useState<string | null>(null);

  useEffect(() => {
    initPaywall();
  }, []);

  const loadOfferings = async (retryCount = 0): Promise<boolean> => {
    const offering = await getOfferings();
    if (offering) {
      // Try standard types first
      let monthly = offering.monthly || null;
      let yearly = offering.annual || null;

      // Fallback: search by identifier or period
      if (!monthly || !yearly) {
        for (const pkg of offering.availablePackages) {
          const id = pkg.identifier?.toLowerCase() || "";
          const period =
            (pkg.product as any)?.subscriptionPeriod?.toLowerCase() || "";
          if (!monthly && (id.includes("month") || period.includes("month"))) {
            monthly = pkg;
          }
          if (
            !yearly &&
            (id.includes("year") ||
              id.includes("annual") ||
              period.includes("year"))
          ) {
            yearly = pkg;
          }
        }
      }

      // Last fallback: if 2 packages, higher price = yearly
      if (!monthly && !yearly && offering.availablePackages.length >= 2) {
        const sorted = [...offering.availablePackages].sort(
          (a, b) => a.product.price - b.product.price,
        );
        monthly = sorted[0];
        yearly = sorted[sorted.length - 1];
      }

      // If only one package exists, set it as monthly
      if (!monthly && !yearly && offering.availablePackages.length === 1) {
        monthly = offering.availablePackages[0];
        setSelectedPlan("monthly");
      }

      setMonthlyPkg(monthly);
      setYearlyPkg(yearly);

      if (!monthly && !yearly) {
        setOfferingsError(
          "Products found but no subscription packages detected. Check that your RevenueCat products are configured as subscriptions.",
        );
        return false;
      }

      return true;
    }

    // Auto-retry once with a delay (offerings may not be cached yet)
    if (retryCount < 1) {
      console.log("[Paywall] No offerings, retrying in 2s...");
      await new Promise((r) => setTimeout(r, 2000));
      return loadOfferings(retryCount + 1);
    }

    return false;
  };

  const initPaywall = async () => {
    const initSuccess = await initRevenueCat();
    if (!initSuccess) {
      setOfferingsError(
        "Could not connect to RevenueCat. Check your API key and network connection.",
      );
      setLoading(false);
      return;
    }

    const success = await loadOfferings();
    if (!success && !offeringsError) {
      setOfferingsError(
        "No subscription plans available. Make sure offerings are configured in the RevenueCat dashboard and products exist in Google Play Console.",
      );
    }
    setLoading(false);
  };

  const selectedPackage = selectedPlan === "yearly" ? yearlyPkg : monthlyPkg;

  const handlePurchase = async () => {
    if (!selectedPackage) {
      showAlert({
        title: "Not Available Yet",
        message:
          "Subscription packages are being configured. Please check back soon.",
        type: "warning",
      });
      return;
    }
    setIsPurchasing(true);
    try {
      const success = await purchasePackage(selectedPackage);
      if (success) {
        await resetAnalysisCount();
        showAlert({
          title: "Welcome to Pro!",
          message:
            "You now have unlimited analyses. Time to level up your speeches!",
          type: "success",
          buttons: [{ text: "Let's go!", onPress: () => router.back() }],
        });
      }
    } catch {
      showAlert({
        title: "Something Went Wrong",
        message: "We couldn't complete your purchase. Please try again.",
        type: "error",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const restored = await restorePurchases();
      if (restored) {
        await resetAnalysisCount();
        showAlert({
          title: "Purchases Restored!",
          message: "Your Pro access has been restored.",
          type: "success",
          buttons: [{ text: "Great!", onPress: () => router.back() }],
        });
      } else {
        showAlert({
          title: "No Purchases Found",
          message: "We couldn't find any previous purchases to restore.",
          type: "warning",
        });
      }
    } catch {
      showAlert({
        title: "Restore Failed",
        message: "Something went wrong. Please try again.",
        type: "error",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleRetry = async () => {
    setLoading(true);
    setOfferingsError(null);
    setMonthlyPkg(null);
    setYearlyPkg(null);
    await initPaywall();
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#023047",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color="#ffb703" />
      </SafeAreaView>
    );
  }

  const features = [
    "Unlimited speech analyses",
    "AI-powered coaching feedback",
    "Vocabulary boost suggestions",
    "Recurring mistake tracking",
    "Score trend insights",
    "Speaker insight from TED experts",
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#023047" }}>
      <View className="flex-1 px-6 py-4">
        {/* Close button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="self-end p-2 rounded-full mb-4"
          style={{ backgroundColor: "#ffffff10" }}
        >
          <XMarkIcon size={24} color="#8ecae6" />
        </TouchableOpacity>

        {/* Header */}
        <View className="items-center mb-6">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: "#ffb703" }}
          >
            <SparklesIcon size={40} color="#023047" />
          </View>
          <Text
            className="text-3xl text-center text-white mb-2"
            style={{ fontFamily: "CabinetGrotesk-Bold" }}
          >
            Upgrade to Pro
          </Text>
          <Text
            className="text-base text-center"
            style={{ fontFamily: "CabinetGrotesk-Regular", color: "#8ecae6" }}
          >
            You've used all {FREE_LIMIT} free analyses.{"\n"}
            Unlock unlimited access to keep improving!
          </Text>
        </View>

        {/* Features list */}
        <View className="mb-6">
          {features.map((feature, i) => (
            <View key={i} className="flex-row items-center mb-2.5">
              <View
                className="w-5 h-5 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: "#22c55e" }}
              >
                <CheckCircleIcon size={12} color="#ffffff" />
              </View>
              <Text
                className="text-sm text-white flex-1"
                style={{ fontFamily: "CabinetGrotesk-Medium" }}
              >
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {/* Package selection */}
        {(yearlyPkg || monthlyPkg) && (
          <View className="mb-6">
            {yearlyPkg && (
              <TouchableOpacity
                onPress={() => setSelectedPlan("yearly")}
                className="rounded-2xl p-4 mb-3 flex-row items-center justify-between"
                style={{
                  backgroundColor:
                    selectedPlan === "yearly" ? "#034569" : "#011627",
                  borderWidth: 2,
                  borderColor:
                    selectedPlan === "yearly" ? "#ffb703" : "#034569",
                }}
                activeOpacity={0.7}
              >
                <View>
                  <View className="flex-row items-center">
                    <Text
                      className="text-white text-base"
                      style={{ fontFamily: "CabinetGrotesk-Bold" }}
                    >
                      Yearly
                    </Text>
                    <View
                      className="ml-2 px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "#22c55e" }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          color: "#fff",
                          fontFamily: "CabinetGrotesk-Bold",
                        }}
                      >
                        BEST VALUE
                      </Text>
                    </View>
                  </View>
                  <Text
                    className="text-xs mt-1"
                    style={{
                      fontFamily: "CabinetGrotesk-Regular",
                      color: "#8ecae6",
                    }}
                  >
                    {yearlyPkg.product.description || "Unlimited analyses"}
                  </Text>
                </View>
                <View className="items-end">
                  <Text
                    className="text-white text-lg"
                    style={{ fontFamily: "CabinetGrotesk-Bold" }}
                  >
                    {yearlyPkg.product.priceString}
                  </Text>
                  <Text
                    className="text-xs"
                    style={{
                      fontFamily: "CabinetGrotesk-Light",
                      color: "#8ecae6",
                    }}
                  >
                    /year
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {monthlyPkg && (
              <TouchableOpacity
                onPress={() => setSelectedPlan("monthly")}
                className="rounded-2xl p-4 flex-row items-center justify-between"
                style={{
                  backgroundColor:
                    selectedPlan === "monthly" ? "#034569" : "#011627",
                  borderWidth: 2,
                  borderColor:
                    selectedPlan === "monthly" ? "#ffb703" : "#034569",
                }}
                activeOpacity={0.7}
              >
                <View>
                  <Text
                    className="text-white text-base"
                    style={{ fontFamily: "CabinetGrotesk-Bold" }}
                  >
                    Monthly
                  </Text>
                  <Text
                    className="text-xs mt-1"
                    style={{
                      fontFamily: "CabinetGrotesk-Regular",
                      color: "#8ecae6",
                    }}
                  >
                    {monthlyPkg.product.description || "Unlimited analyses"}
                  </Text>
                </View>
                <View className="items-end">
                  <Text
                    className="text-white text-lg"
                    style={{ fontFamily: "CabinetGrotesk-Bold" }}
                  >
                    {monthlyPkg.product.priceString}
                  </Text>
                  <Text
                    className="text-xs"
                    style={{
                      fontFamily: "CabinetGrotesk-Light",
                      color: "#8ecae6",
                    }}
                  >
                    /month
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Retry button when offerings fail */}
        {offeringsError && !yearlyPkg && !monthlyPkg && (
          <View className="mb-4">
            <Text
              className="text-xs text-center mb-3"
              style={{ fontFamily: "CabinetGrotesk-Regular", color: "#fb8500" }}
            >
              {offeringsError}
            </Text>
            <TouchableOpacity
              onPress={handleRetry}
              className="rounded-2xl p-4 items-center flex-row justify-center"
              style={{ backgroundColor: "#034569" }}
              activeOpacity={0.8}
            >
              <ArrowPathIcon size={18} color="#8ecae6" />
              <Text
                className="text-sm text-white ml-2"
                style={{ fontFamily: "CabinetGrotesk-Bold" }}
              >
                Retry Loading Plans
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Purchase button */}
        <TouchableOpacity
          onPress={handlePurchase}
          disabled={isPurchasing}
          className="rounded-2xl p-5 items-center mb-4"
          style={{
            backgroundColor: isPurchasing ? "#ffb70380" : "#ffb703",
          }}
          activeOpacity={0.8}
        >
          <Text
            className="text-lg"
            style={{ fontFamily: "CabinetGrotesk-Bold", color: "#023047" }}
          >
            {isPurchasing ? "Processing..." : "Subscribe to Pro"}
          </Text>
          <Text
            className="text-sm mt-1"
            style={{ fontFamily: "CabinetGrotesk-Regular", color: "#023047" }}
          >
            Cancel anytime
          </Text>
        </TouchableOpacity>

        {/* Restore Purchases */}
        <TouchableOpacity
          onPress={handleRestore}
          disabled={isRestoring}
          className="items-center py-3 mb-2"
          activeOpacity={0.7}
        >
          <Text
            className="text-sm"
            style={{
              fontFamily: "CabinetGrotesk-Medium",
              color: "#8ecae6",
              opacity: isRestoring ? 0.5 : 1,
            }}
          >
            {isRestoring ? "Restoring..." : "Restore Purchases"}
          </Text>
        </TouchableOpacity>

        {/* Terms */}
        <Text
          className="text-center text-xs mt-auto"
          style={{ fontFamily: "CabinetGrotesk-Light", color: "#8ecae680" }}
        >
          Payment will be charged to your App Store or Google Play account.
          Subscription automatically renews unless cancelled at least 24 hours
          before the end of the current period.
        </Text>
      </View>
    </SafeAreaView>
  );
}
