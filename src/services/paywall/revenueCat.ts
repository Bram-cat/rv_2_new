import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from "react-native-purchases";

const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUE_CAT_API_KEY || "";
const ENTITLEMENT_ID = "rv_hackathon_2 Pro";

let isInitialized = false;

export { ENTITLEMENT_ID };

export async function initRevenueCat(): Promise<void> {
  if (isInitialized) return;

  try {
    if (!REVENUECAT_API_KEY) {
      console.log("[RevenueCat] No API key provided, skipping init.");
      return;
    }

    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
    isInitialized = true;
    console.log("[RevenueCat] Initialized successfully");
  } catch (error: any) {
    console.warn("[RevenueCat] Init skipped:", error.message || error);
  }
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
  if (!isInitialized) return false;
  try {
    const info = await Purchases.getCustomerInfo();
    return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch {
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
  if (!isInitialized) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch {
    return null;
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  if (!isInitialized) return false;
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    if (!isPro) {
      console.log(
        "[RevenueCat] Purchase completed. Active entitlements:",
        Object.keys(customerInfo.entitlements.active),
      );
    }
    // Purchase completed successfully — return true even if entitlement
    // takes a moment to propagate
    return true;
  } catch (error: any) {
    if (error.userCancelled) {
      console.log("[RevenueCat] User cancelled purchase");
      return false;
    }
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
    console.warn("[RevenueCat] Customer center not available:", error.message || error);
  }
}
