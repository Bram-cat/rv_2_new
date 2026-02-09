import AsyncStorage from "@react-native-async-storage/async-storage";
import { checkProStatus } from "./revenueCat";

const USAGE_KEY = "@speechi_analysis_count";
const FREE_ANALYSIS_LIMIT = 3;

export async function getAnalysisCount(): Promise<number> {
  try {
    const count = await AsyncStorage.getItem(USAGE_KEY);
    return count ? parseInt(count, 10) : 0;
  } catch {
    return 0;
  }
}

export async function incrementAnalysisCount(): Promise<number> {
  const current = await getAnalysisCount();
  const newCount = current + 1;
  await AsyncStorage.setItem(USAGE_KEY, newCount.toString());
  return newCount;
}

export async function hasReachedFreeLimit(): Promise<boolean> {
  // Pro users have unlimited access
  try {
    const isPro = await checkProStatus();
    if (isPro) return false;
  } catch {}

  const count = await getAnalysisCount();
  return count >= FREE_ANALYSIS_LIMIT;
}

export async function resetAnalysisCount(): Promise<void> {
  await AsyncStorage.setItem(USAGE_KEY, "0");
}

export const FREE_LIMIT = FREE_ANALYSIS_LIMIT;
