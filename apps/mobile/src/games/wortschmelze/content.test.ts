import { describe, expect, it } from "vitest";

import { wortschmelzePuzzlesByPreset } from "./content";

const blockedComponents = new Set([
  "admin", "alien", "audio", "award", "bacon", "basic", "comic", "crash", "flash", "flush",
  "happy", "image", "intro", "joker", "laser", "level", "login", "party", "pixel", "radio",
  "robot", "shake", "shirt", "smart", "sport", "story", "super", "team", "video",
]);

describe("wortschmelze content", () => {
  it("does not use blocked English-looking components", () => {
    for (const puzzles of Object.values(wortschmelzePuzzlesByPreset)) {
      expect(puzzles.some((puzzle) => blockedComponents.has(puzzle.left) || blockedComponents.has(puzzle.right))).toBe(false);
    }
  });
});
