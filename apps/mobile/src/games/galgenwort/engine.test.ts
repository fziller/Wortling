import { describe, expect, it } from "vitest";

import { createGalgenwortState, getGalgenwortRevealedLetters, getGalgenwortWrongLetters, submitGalgenwortLetter } from "./engine";
import type { GalgenwortPuzzle } from "./types";

const puzzle: GalgenwortPuzzle = {
  id: "test",
  version: 1,
  answer: "banane",
  clue: "Obst",
  maxWrongGuesses: 2
};

describe("galgenwort engine", () => {
  it("reveals every matching letter", () => {
    const state = submitGalgenwortLetter(puzzle, createGalgenwortState(puzzle), "n").state;

    expect(getGalgenwortRevealedLetters(puzzle, state)).toEqual(["", "", "n", "", "n", ""]);
  });

  it("rejects repeated letters", () => {
    const first = submitGalgenwortLetter(puzzle, createGalgenwortState(puzzle), "b");
    const repeated = submitGalgenwortLetter(puzzle, first.state, "b");

    expect(first.ok).toBe(true);
    expect(repeated.ok).toBe(false);
  });

  it("wins and loses", () => {
    let wonState = createGalgenwortState(puzzle);
    for (const letter of ["b", "a", "n", "e"]) wonState = submitGalgenwortLetter(puzzle, wonState, letter).state;

    let lostState = createGalgenwortState(puzzle);
    lostState = submitGalgenwortLetter(puzzle, lostState, "x").state;
    lostState = submitGalgenwortLetter(puzzle, lostState, "y").state;

    expect(wonState.status).toBe("won");
    expect(lostState.status).toBe("lost");
    expect(getGalgenwortWrongLetters(puzzle, lostState)).toEqual(["x", "y"]);
  });
});
