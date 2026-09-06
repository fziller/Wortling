import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "wortkniff:onboarding:v1";

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export async function markOnboardingSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Onboarding is nice-to-have; storage failures must not block Home.
  }
}

export async function resetOnboarding(): Promise<void> {
  if (!__DEV__) return;

  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {}
}
