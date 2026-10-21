import { describe, expect, it } from "vitest";

import { getStoredOfficialOutcome, mergeCompletedStatus, resolveOfficialOutcome } from "./progress";
import type { StoredProgress } from "./progress";

describe("mergeCompletedStatus", () => {
  it("keeps a previous win when later rounds lose", () => {
    expect(mergeCompletedStatus("won", "lost")).toBe("won");
    expect(mergeCompletedStatus("won", "revealed")).toBe("won");
  });

  it("upgrades earlier failures to won", () => {
    expect(mergeCompletedStatus("lost", "won")).toBe("won");
  });

  it("keeps a loss official after continuing", () => {
    expect(resolveOfficialOutcome("lost", "won", false)).toBe("lost");
    expect(resolveOfficialOutcome(undefined, "won", true)).toBe("lost");
    expect(getStoredOfficialOutcome({ continuedAfterLoss: true } as StoredProgress)).toBe("lost");
  });
});
