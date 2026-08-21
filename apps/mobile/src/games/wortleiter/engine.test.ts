import { describe, expect, it } from "vitest";

import { createWortleiterState, isValidTransition, revealWortleiterSolution, submitWortleiterGuess, undoWortleiterStep } from "./engine";
import type { WortleiterPuzzle, WortleiterState } from "./types";

const puzzle: WortleiterPuzzle = {
  id: "test",
  version: 1,
  startWord: "haus",
  targetWord: "mais",
  wordLength: 4,
  optimalSteps: 2,
  difficulty: "easy",
  solution: ["haus", "maus", "mais"]
};

describe("wortleiter engine", () => {
  it("validates exactly one changed letter", () => {
    expect(isValidTransition("HAUS", "maus")).toBe(true);
    expect(isValidTransition("maus", "mais")).toBe(true);
    expect(isValidTransition("haus", "mist")).toBe(false);
    expect(isValidTransition("haus", "haus")).toBe(false);
    expect(isValidTransition("haus", "hause")).toBe(false);
  });

  it("handles umlauts natively", () => {
    expect(isValidTransition("böse", "bose")).toBe(true);
    expect(isValidTransition("böse", "boese")).toBe(false);
  });

  it("rejects invalid words, repeats, and multi-letter changes", () => {
    const state = createWortleiterState(puzzle);
    const invalidWord = submitWortleiterGuess(puzzle, state, "zzzz");
    const sameWord = submitWortleiterGuess(puzzle, state, "haus");
    const tooManyLetters = submitWortleiterGuess(puzzle, state, "mist");
    const first = submitWortleiterGuess(puzzle, state, "maus");
    const repeated = submitWortleiterGuess(puzzle, first.state, "haus");

    expect(invalidWord.ok).toBe(false);
    if (invalidWord.ok) throw new Error("invalidWord unexpectedly succeeded");
    expect(invalidWord.reason).toBe("Dieses Wort ist nicht in unserer Wortliste.");
    expect(sameWord.ok).toBe(false);
    if (sameWord.ok) throw new Error("sameWord unexpectedly succeeded");
    expect(sameWord.reason).toBe("Du musst einen Buchstaben ändern.");
    expect(tooManyLetters.ok).toBe(false);
    if (tooManyLetters.ok) throw new Error("tooManyLetters unexpectedly succeeded");
    expect(tooManyLetters.reason).toBe("Ändere genau einen Buchstaben.");
    expect(repeated.ok).toBe(false);
    if (repeated.ok) throw new Error("repeated unexpectedly succeeded");
    expect(repeated.reason).toBe("Dieses Wort hast du schon benutzt.");
  });

  it("accepts a valid path and wins on target", () => {
    const first = submitWortleiterGuess(puzzle, createWortleiterState(puzzle), "MAUS");
    const won = submitWortleiterGuess(puzzle, first.state, "mais");

    expect(first.ok).toBe(true);
    expect(won.ok).toBe(true);
    expect(won.state.words).toEqual(["haus", "maus", "mais"]);
    expect(won.state.status).toBe("won");
  });

  it("undo removes the last step while playing", () => {
    const state = submitWortleiterGuess(puzzle, createWortleiterState(puzzle), "maus").state;

    expect(undoWortleiterStep(state).words).toEqual(["haus"]);
    expect(undoWortleiterStep(createWortleiterState(puzzle)).words).toEqual(["haus"]);
  });

  it("reveal shows the known shortest path", () => {
    const state = revealWortleiterSolution(puzzle, createWortleiterState(puzzle));

    expect(state.status).toBe("revealed");
    expect(state.words).toEqual(["haus", "maus", "mais"]);
  });

  it("persists and restores the full ladder state", () => {
    const state: WortleiterState = submitWortleiterGuess(puzzle, createWortleiterState(puzzle), "maus").state;
    const restored = JSON.parse(JSON.stringify(state)) as WortleiterState;

    expect(restored).toEqual(state);
  });
});
