import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "wortkniff:dev:daily-kniffe-seed";

export async function loadDailyKniffeSeedOverride(): Promise<number | undefined> {
  if (!__DEV__) return undefined;

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const seed = raw ? Number(raw) : undefined;

    return Number.isFinite(seed) ? seed : undefined;
  } catch {
    return undefined;
  }
}

export async function saveDailyKniffeSeedOverride(seed: number): Promise<void> {
  if (!__DEV__) return;

  try {
    await AsyncStorage.setItem(STORAGE_KEY, String(seed));
  } catch {}
}

export async function clearDailyKniffeSeedOverride(): Promise<void> {
  if (!__DEV__) return;

  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {}
}
