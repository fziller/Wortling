import { describe, expect, it } from "vitest";

import { createDailyWortleiterGame } from "./daily";

describe("wortleiter rounds", () => {
  it("starts valid rounds for the same Berlin date", () => {
    const first = createDailyWortleiterGame(new Date("2026-08-21T08:00:00.000Z"));
    const second = createDailyWortleiterGame(new Date("2026-08-21T18:00:00.000Z"));

    expect(second.dateKey).toBe(first.dateKey);
    expect(first.puzzle).toBeTruthy();
    expect(second.puzzle).toBeTruthy();
  });
});
