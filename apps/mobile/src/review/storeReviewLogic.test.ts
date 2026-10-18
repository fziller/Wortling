import { describe, expect, it } from "vitest";

import { getStoreReviewUrls, hasSeenReviewPrompt, REVIEW_PROMPT_SEEN_VALUE } from "./storeReviewLogic";

describe("store review prompt state", () => {
  it("only treats the persisted marker as seen", () => {
    expect(hasSeenReviewPrompt(null)).toBe(false);
    expect(hasSeenReviewPrompt("old-marker")).toBe(false);
    expect(hasSeenReviewPrompt(REVIEW_PROMPT_SEEN_VALUE)).toBe(true);
  });

  it("uses direct write-review URLs with an Android HTTPS fallback", () => {
    expect(getStoreReviewUrls("ios")).toEqual({
      primary: "https://apps.apple.com/de/app/wortkniff-t%C3%A4gliche-wortspiele/id6809042313?action=write-review",
    });
    expect(getStoreReviewUrls("android")).toEqual({
      primary: "market://details?id=com.existuus.wortling",
      fallback: "https://play.google.com/store/apps/details?id=com.existuus.wortling",
    });
  });
});
