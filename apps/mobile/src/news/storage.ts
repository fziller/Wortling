import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "wortkniff:news:lastSeen";

export async function hasSeenNews(newsId: string): Promise<boolean> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY) === newsId;
  } catch {
    return true;
  }
}

export async function markNewsSeen(newsId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, newsId);
  } catch {}
}

export async function resetNews(): Promise<void> {
  if (!__DEV__) return;

  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {}
}
