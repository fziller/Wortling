import { describe, expect, it } from "vitest";

import { mergeCompletedStatus } from "./progress";

describe("mergeCompletedStatus", () => {
  it("keeps a previous win when later rounds lose", () => {
    expect(mergeCompletedStatus("won", "lost")).toBe("won");
    expect(mergeCompletedStatus("won", "revealed")).toBe("won");
  });

  it("upgrades earlier failures to won", () => {
    expect(mergeCompletedStatus("lost", "won")).toBe("won");
  });
});
