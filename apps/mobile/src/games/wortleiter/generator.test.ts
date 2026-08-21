import { describe, expect, it } from "vitest";

import { buildPatternBuckets, createWortleiterPuzzle, findShortestPath, isSuitableWortleiterPath } from "./generator";

describe("wortleiter generator helpers", () => {
  it("returns null when no path exists", () => {
    const buckets = buildPatternBuckets(["haus", "boot"]);

    expect(findShortestPath("haus", "boot", buckets)).toBeNull();
  });

  it("finds direct neighbors but filters them as unsuitable puzzles", () => {
    const buckets = buildPatternBuckets(["haus", "maus"]);
    const path = findShortestPath("haus", "maus", buckets);

    expect(path).toEqual(["haus", "maus"]);
    expect(isSuitableWortleiterPath(path)).toBe(false);
  });

  it("finds a shortest path across multiple options", () => {
    const words = ["haus", "maus", "mais", "hals", "mals"];
    const buckets = buildPatternBuckets(words);

    expect(findShortestPath("haus", "mais", buckets)).toHaveLength(3);
  });

  it("keeps suitable puzzle metadata with optimal steps", () => {
    const puzzle = createWortleiterPuzzle("test", 2, ["haus", "maus", "mais", "mist"]);

    expect(puzzle.optimalSteps).toBe(3);
    expect(puzzle.difficulty).toBe("easy");
    expect(isSuitableWortleiterPath(puzzle.solution)).toBe(true);
  });
});
