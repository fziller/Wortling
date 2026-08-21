import { describe, expect, it } from "vitest";

import { createDailyWortleiterGame } from "./daily";

describe("wortleiter daily", () => {
  it("picks the same puzzle deterministically for the same Berlin date", () => {
    const first = createDailyWortleiterGame(new Date("2026-08-21T08:00:00.000Z"));
    const second = createDailyWortleiterGame(new Date("2026-08-21T18:00:00.000Z"));

    expect(second.dateKey).toBe(first.dateKey);
    expect(second.puzzle.id).toBe(first.puzzle.id);
  });
});
