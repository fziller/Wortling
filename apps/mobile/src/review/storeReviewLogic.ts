export const REVIEW_PROMPT_SEEN_VALUE = "1";

export type StoreReviewPlatform = "ios" | "android" | "other";

export type StoreReviewUrls = {
  primary: string;
  fallback?: string;
};

export function hasSeenReviewPrompt(value: string | null): boolean {
  return value === REVIEW_PROMPT_SEEN_VALUE;
}

export function getStoreReviewUrls(platform: StoreReviewPlatform): StoreReviewUrls {
  if (platform === "android") {
    return {
      primary: "market://details?id=com.existuus.wortling",
      fallback: "https://play.google.com/store/apps/details?id=com.existuus.wortling",
    };
  }

  return {
    primary: "https://apps.apple.com/de/app/wortkniff-t%C3%A4gliche-wortspiele/id6809042313?action=write-review",
  };
}
