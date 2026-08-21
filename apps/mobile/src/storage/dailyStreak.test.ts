import { describe, expect, it } from "vitest";

import { updateDailyStreak } from "./dailyStreak";

describe("daily streak", () => {
  it("starts at one on the first completed day", () => {
    expect(updateDailyStreak({ current: 0, best: 0 }, "2026-08-21")).toEqual({
      current: 1,
      best: 1,
      lastCompletedDateKey: "2026-08-21",
    });
  });

  it("extends on consecutive days", () => {
    expect(updateDailyStreak({ current: 2, best: 2, lastCompletedDateKey: "2026-08-20" }, "2026-08-21")).toEqual({
      current: 3,
      best: 3,
      lastCompletedDateKey: "2026-08-21",
    });
  });

  it("does not double count the same day", () => {
    const streak = { current: 2, best: 5, lastCompletedDateKey: "2026-08-21" };

    expect(updateDailyStreak(streak, "2026-08-21")).toEqual(streak);
  });

  it("resets after a missed day", () => {
    expect(updateDailyStreak({ current: 4, best: 4, lastCompletedDateKey: "2026-08-19" }, "2026-08-21")).toEqual({
      current: 1,
      best: 4,
      lastCompletedDateKey: "2026-08-21",
    });
  });
});
