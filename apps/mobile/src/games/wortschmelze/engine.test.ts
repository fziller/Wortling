import { describe, expect, it } from "vitest";

import { isAllowedWortschmelzeGuess, wortschmelzePuzzlesByPreset } from "./content";
import { createWortschmelzePuzzle } from "./daily";
import { submitWortschmelzeGuess } from "./engine";
import { createWorttrefferState } from "../worttreffer/engine";

describe("wortschmelze", () => {
  it("generates structurally valid 5+5 overlap puzzles", () => {
    for (const puzzles of Object.values(wortschmelzePuzzlesByPreset)) {
      expect(puzzles.length).toBeGreaterThan(0);
      for (const puzzle of puzzles.slice(0, 100)) {
        expect(Array.from(puzzle.left)).toHaveLength(5);
        expect(Array.from(puzzle.right)).toHaveLength(5);
        expect(Array.from(puzzle.answer)).toHaveLength(8);
        expect(puzzle.left.endsWith(puzzle.overlap)).toBe(true);
        expect(puzzle.right.startsWith(puzzle.overlap)).toBe(true);
        expect(puzzle.answer).toBe(puzzle.left + Array.from(puzzle.right).slice(2).join(""));
      }
    }
  });

  it("accepts generated merge guesses", () => {
    const item = wortschmelzePuzzlesByPreset.klassisch[0];
    const puzzle = createWortschmelzePuzzle(item, "test");
    const result = submitWortschmelzeGuess(puzzle, createWorttrefferState(puzzle), item.answer);

    expect(result.ok).toBe(true);
    expect(result.state.status).toBe("won");
  });

  it("allows structurally valid guesses even when they are not targets", () => {
    expect(isAllowedWortschmelzeGuess("walzebra")).toBe(true);
  });
});
