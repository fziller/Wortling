import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "wortkniff:daily-kniffe:reward-seen-date";

export async function hasSeenDailyKniffeReward(dateKey: string): Promise<boolean> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY) === dateKey;
  } catch {
    return true;
  }
}

export async function markDailyKniffeRewardSeen(dateKey: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, dateKey);
  } catch {
    // The celebration is optional; never block home when local storage is unavailable.
  }
}
