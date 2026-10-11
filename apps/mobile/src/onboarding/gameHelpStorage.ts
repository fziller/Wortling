import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY_PREFIX = "wortkniff:game-help:v1:";

export async function hasSeenGameHelp(gameId: string): Promise<boolean> {
  try {
    return await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${gameId}`) === "1";
  } catch {
    // Existing players should never be interrupted when local storage is unavailable.
    return true;
  }
}

export async function markGameHelpSeen(gameId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}${gameId}`, "1");
  } catch {
    // Help is nice-to-have; storage failures must not block gameplay.
  }
}
