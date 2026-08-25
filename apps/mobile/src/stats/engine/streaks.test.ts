import { describe, expect, it } from "vitest";

import { computeStreaks } from "./streaks";

describe("computeStreaks", () => {
  it("returns zeros without dates", () => {
    expect(computeStreaks([], "2026-08-23")).toEqual({ current: 0, longest: 0 });
  });

  it("counts a run ending today", () => {
    const days = ["2026-08-21", "2026-08-22", "2026-08-23"];

    expect(computeStreaks(days, "2026-08-23")).toEqual({ current: 3, longest: 3 });
  });

  it("keeps the streak alive when today has no entry yet", () => {
    const days = ["2026-08-20", "2026-08-21", "2026-08-22"];

    expect(computeStreaks(days, "2026-08-23")).toEqual({ current: 3, longest: 3 });
  });

  it("breaks the streak after a full missed day", () => {
    const days = ["2026-08-19", "2026-08-20"];

    expect(computeStreaks(days, "2026-08-23")).toEqual({ current: 0, longest: 2 });
  });

  it("reports the longest run across gaps", () => {
    const days = [
      "2026-08-01",
      "2026-08-02",
      "2026-08-03",
      "2026-08-04",
      "2026-08-10",
      "2026-08-11",
    ];

    expect(computeStreaks(days, "2026-08-11")).toEqual({ current: 2, longest: 4 });
  });
});
