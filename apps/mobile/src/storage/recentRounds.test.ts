import { describe, expect, it, beforeEach } from "vitest";

import { pickFreshRound, resetRecentRoundsForTests } from "./recentRounds";

describe("recent rounds", () => {
  beforeEach(() => resetRecentRoundsForTests());

  it("skips recently selected puzzles", () => {
    const first = pickFreshRound("game", () => "tatzeit", (value) => value);
    let picks = 0;
    const second = pickFreshRound("game", () => {
      picks += 1;
      return picks === 1 ? "tatzeit" : "blume";
    }, (value) => value);

    expect(first).toBe("tatzeit");
    expect(second).toBe("blume");
  });

  it("falls back when every available puzzle is recent", () => {
    pickFreshRound("game", () => "tatzeit", (value) => value);

    expect(pickFreshRound("game", () => "tatzeit", (value) => value)).toBe("tatzeit");
  });
});
