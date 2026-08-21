import { describe, expect, it } from "vitest";

import { allowedGuesses, WORTLEITER_WORD_LENGTH, wortleiterPuzzles } from "./content";
import { isValidTransition } from "./engine";

describe("wortleiter content", () => {
  it("keeps generated words and puzzle solutions playable", () => {
    const allowed = new Set(allowedGuesses);

    expect(allowedGuesses.every((word) => Array.from(word).length === WORTLEITER_WORD_LENGTH)).toBe(true);
    expect(wortleiterPuzzles.length).toBeGreaterThan(0);
    expect(wortleiterPuzzles.every((puzzle) => puzzle.solution.every((word) => allowed.has(word)))).toBe(true);
    expect(wortleiterPuzzles.every((puzzle) => puzzle.solution.every((word, index) => index === 0 || isValidTransition(puzzle.solution[index - 1], word)))).toBe(true);
  });
});
