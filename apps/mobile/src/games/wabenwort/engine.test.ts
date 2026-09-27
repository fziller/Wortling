import { describe, expect, it } from "vitest";

import { createWabenwortState, getWabenwortRank, revealWabenwortSolution, submitWabenwortWord } from "./engine";
import type { WabenwortPuzzle } from "./types";

const puzzle: WabenwortPuzzle = {
  id: "test",
  version: 2,
  letters: ["a", "e", "h", "l", "m", "n", "r"],
  centerLetter: "a",
  words: [
    { word: "ahne", score: 1, isPangram: false },
    { word: "mahler", score: 6, isPangram: false },
    { word: "mahnmaler", score: 16, isPangram: true },
  ],
  allowedWords: ["ahne", "mahler", "mahnmaler", "mahne"],
  bronzeWords: 1,
  silverWords: 2,
  goldWords: 4,
  bronzeScore: 1,
  silverScore: 7,
  goldScore: 20,
  totalScore: 23,
};

describe("Wabenwort engine", () => {
  it("requires center letter and only honeycomb letters", () => {
    const state = createWabenwortState(puzzle);
    expect(submitWabenwortWord(puzzle, state, "ehre").ok).toBe(false);
    expect(submitWabenwortWord(puzzle, state, "maus").ok).toBe(false);
  });

  it("ranks by found word count and completes at the gold word goal", () => {
    const start = createWabenwortState(puzzle);
    const first = submitWabenwortWord(puzzle, start, "ahne");
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(getWabenwortRank(puzzle, first.state)).toBe("bronze");
    expect(first.state.status).toBe("playing");
    expect(submitWabenwortWord(puzzle, first.state, "ahne").ok).toBe(false);
    const second = submitWabenwortWord(puzzle, first.state, "mahnmaler");
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(getWabenwortRank(puzzle, second.state)).toBe("silber");
    expect(second.state.status).toBe("playing");
    const third = submitWabenwortWord(puzzle, second.state, "mahler");
    expect(third.ok).toBe(true);
    if (!third.ok) return;
    expect(third.state.status).toBe("playing");
    const gold = submitWabenwortWord(puzzle, third.state, "mahne");
    expect(gold.ok).toBe(true);
    if (gold.ok) {
      expect(getWabenwortRank(puzzle, gold.state)).toBe("gold");
      expect(gold.state.status).toBe("won");
    }
  });

  it("accepts a validated inflected word outside curated scoring words", () => {
    const result = submitWabenwortWord(puzzle, createWabenwortState(puzzle), "mahne");
    expect(result.ok).toBe(true);
  });

  it("reveal keeps found words and only flips status", () => {
    const start = createWabenwortState(puzzle);
    const first = submitWabenwortWord(puzzle, start, "ahne");
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const revealed = revealWabenwortSolution(puzzle, first.state);
    expect(revealed.status).toBe("revealed");
    expect(revealed.foundWords).toEqual(["ahne"]);
  });
});
