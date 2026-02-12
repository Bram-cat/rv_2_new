import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from "react-native-purchases";
import { Platform } from "react-native";

const GOOGLE_KEY = process.env.EXPO_PUBLIC_REVENUE_CAT_API_KEY || "";

// Use the production Google Play API key (goog_*) — NOT the sandbox/test key
const REVENUECAT_API_KEY = GOOGLE_KEY;
const ENTITLEMENT_ID = "Speechi Premium";

let initPromise: Promise<boolean> | null = null;
let isInitialized = false;

export { ENTITLEMENT_ID };

export async function initRevenueCat(): Promise<boolean> {
  // Return existing promise if init is already in progress (prevents double-configure)
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (isInitialized) return true;

    try {
      if (!REVENUECAT_API_KEY) {
        console.warn("[RevenueCat] No API key provided, skipping init.");
        return false;
      }

      Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

      if (Platform.OS === "android") {
        await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      } else {
        await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      }

      isInitialized = true;
      console.log(
        "[RevenueCat] Initialized successfully (" +
          (REVENUECAT_API_KEY.startsWith("test_") ? "SANDBOX/TEST STORE" : "PRODUCTION") +
          ") with key: " +
          REVENUECAT_API_KEY.substring(0, 8) +
          "...",
      );
      return true;
    } catch (error: any) {
      console.warn("[RevenueCat] Init failed:", error.message || error);
      // Reset so we can retry
      initPromise = null;
      return false;
    }
  })();

  return initPromise;
}

export function isRevenueCatReady(): boolean {
  return isInitialized;
}

export async function identifyUser(userId: string): Promise<void> {
  if (!isInitialized) return;
  try {
    await Purchases.logIn(userId);
    console.log("[RevenueCat] User identified:", userId);
  } catch (error: any) {
    console.warn("[RevenueCat] Identify error:", error.message || error);
  }
}

export async function logoutUser(): Promise<void> {
  if (!isInitialized) return;
  try {
    await Purchases.logOut();
    console.log("[RevenueCat] User logged out");
  } catch (error: any) {
    console.warn("[RevenueCat] Logout error:", error.message || error);
  }
}

export async function checkProStatus(): Promise<boolean> {
  // Wait for init if it's in progress
  if (initPromise) await initPromise;
  if (!isInitialized) return false;
  try {
    const info = await Purchases.getCustomerInfo();
    const isPro = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
    console.log(
      "[RevenueCat] Pro status:",
      isPro,
      "| Active entitlements:",
      Object.keys(info.entitlements.active),
    );
    return isPro;
  } catch (error: any) {
    console.warn("[RevenueCat] checkProStatus error:", error.message || error);
    return false;
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isInitialized) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}

export async function getOfferings(): Promise<PurchasesOffering | null> {
  // Wait for init if it's in progress
  if (initPromise) {
    const initResult = await initPromise;
    if (!initResult) {
      console.warn("[RevenueCat] getOfferings: SDK failed to initialize");
      return null;
    }
  }

  if (!isInitialized) {
    console.warn("[RevenueCat] getOfferings: SDK not initialized");
    return null;
  }

  try {
    const offerings = await Purchases.getOfferings();
    console.log(
      "[RevenueCat] All offerings:",
      JSON.stringify(Object.keys(offerings.all)),
    );
    console.log(
      "[RevenueCat] Current offering:",
      offerings.current?.identifier || "NONE",
    );

    if (offerings.current) {
      console.log(
        "[RevenueCat] Available packages:",
        offerings.current.availablePackages.map(
          (p) =>
            `${p.identifier} (${p.packageType}) - ${p.product.priceString}`,
        ),
      );
    } else {
      console.warn(
        "[RevenueCat] No current offering found. " +
          "Make sure you have set a 'Current' offering in the RevenueCat dashboard " +
          "and that products are properly configured in Google Play Console.",
      );

      // Try to find any offering if current is null
      const allKeys = Object.keys(offerings.all);
      if (allKeys.length > 0) {
        const fallback = offerings.all[allKeys[0]];
        console.log(
          "[RevenueCat] Using fallback offering:",
          fallback.identifier,
        );
        return fallback;
      }
    }

    return offerings.current;
  } catch (error: any) {
    console.warn("[RevenueCat] getOfferings error:", error.message || error);
    return null;
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  if (!isInitialized) return false;
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPro =
      customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    console.log(
      "[RevenueCat] Purchase completed. Pro:",
      isPro,
      "| Active entitlements:",
      Object.keys(customerInfo.entitlements.active),
    );
    // Purchase completed successfully — return true even if entitlement
    // takes a moment to propagate
    return true;
  } catch (error: any) {
    if (error.userCancelled) {
      console.log("[RevenueCat] User cancelled purchase");
      return false;
    }
    console.warn("[RevenueCat] Purchase error:", error.message || error);
    throw error;
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (!isInitialized) return false;
  try {
    const info = await Purchases.restorePurchases();
    return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch {
    return false;
  }
}

export async function presentNativePaywall(): Promise<boolean> {
  if (!isInitialized) return false;
  try {
    const RevenueCatUI = require("react-native-purchases-ui").default;
    const { PAYWALL_RESULT } = require("react-native-purchases-ui");
    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: ENTITLEMENT_ID,
    });
    return (
      result === PAYWALL_RESULT.PURCHASED ||
      result === PAYWALL_RESULT.RESTORED ||
      result === PAYWALL_RESULT.NOT_PRESENTED
    );
  } catch (error) {
    console.warn("[RevenueCat] Native paywall not available:", error);
    return false;
  }
}

export async function presentCustomerCenter(): Promise<void> {
  if (!isInitialized) return;
  try {
    const RevenueCatUI = require("react-native-purchases-ui").default;
    await RevenueCatUI.presentCustomerCenter();
  } catch (error: any) {
    console.warn(
      "[RevenueCat] Customer center not available:",
      error.message || error,
    );
  }
}
