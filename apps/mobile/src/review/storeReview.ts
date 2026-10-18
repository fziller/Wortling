import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";

const STORAGE_KEY = "wortkniff:store-review-requested:v1";

export type StoreReviewRequestResult = "requested" | "unavailable" | "already_requested";

export async function requestStoreReview(): Promise<Exclude<StoreReviewRequestResult, "already_requested">> {
  try {
    if (!await StoreReview.isAvailableAsync()) return "unavailable";

    await StoreReview.requestReview();
    return "requested";
  } catch {
    // Native review prompts are optional and platform-quota limited.
    return "unavailable";
  }
}

export async function requestStoreReviewOnce(): Promise<StoreReviewRequestResult> {
  try {
    if (await AsyncStorage.getItem(STORAGE_KEY) === "1") return "already_requested";

    if (!await StoreReview.isAvailableAsync()) return "unavailable";

    const result = await requestStoreReview();
    if (result === "requested") await AsyncStorage.setItem(STORAGE_KEY, "1");

    return result;
  } catch {
    // Native review prompts are optional and platform-quota limited.
    return "unavailable";
  }
}

export async function isStoreReviewAvailable(): Promise<boolean> {
  try {
    return await StoreReview.isAvailableAsync();
  } catch {
    return false;
  }
}
