import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";
import { Linking, Platform } from "react-native";

import { getStoreReviewUrls, hasSeenReviewPrompt, type StoreReviewPlatform } from "./storeReviewLogic";

const STORAGE_KEY = "wortkniff:store-review-prompt-seen:v2";

export type StoreReviewRequestResult = "requested" | "unavailable";
export type StoreReviewPageResult = "opened" | "unavailable";

export async function requestStoreReview(): Promise<StoreReviewRequestResult> {
  try {
    if (!await StoreReview.isAvailableAsync()) return "unavailable";

    await StoreReview.requestReview();
    return "requested";
  } catch {
    // Native review prompts are optional and platform-quota limited.
    return "unavailable";
  }
}

export async function shouldShowStoreReviewPrompt(): Promise<boolean> {
  try {
    return !hasSeenReviewPrompt(await AsyncStorage.getItem(STORAGE_KEY));
  } catch {
    // Do not repeatedly interrupt results when local storage is unavailable.
    return false;
  }
}

export async function markStoreReviewPromptSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Storage failures must not block the result flow.
  }
}

export async function openStoreReviewPage(platform: StoreReviewPlatform = Platform.OS === "android" ? "android" : Platform.OS === "ios" ? "ios" : "other"): Promise<StoreReviewPageResult> {
  const { fallback, primary } = getStoreReviewUrls(platform);

  try {
    await Linking.openURL(primary);
    return "opened";
  } catch {
    // Android market links and platform URL handlers can be unavailable.
  }

  if (!fallback) return "unavailable";

  try {
    await Linking.openURL(fallback);
    return "opened";
  } catch {
    return "unavailable";
  }
}
