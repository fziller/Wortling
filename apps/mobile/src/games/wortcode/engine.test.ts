import { describe, expect, it } from "vitest";

import { WORTCODE_MAX_ATTEMPTS, WORTCODE_WORD_LENGTH, guessWords } from "./content";
import { createWortcodeState, evaluateGuess, submitWortcodeGuess } from "./engine";
import { WortcodePuzzle } from "./types";

const puzzle: WortcodePuzzle = {
  id: "test",
  version: 1,
  answer: "banane",
  wordLength: WORTCODE_WORD_LENGTH,
  maxAttempts: WORTCODE_MAX_ATTEMPTS,
  difficulty: "medium"
};

describe("wortcode engine", () => {
  it("scores exact matches", () => {
    expect(evaluateGuess("banane", "banane")).toEqual({ exactMatches: 6, misplacedMatches: 0 });
  });

  it("handles duplicate letters without reusing target letters", () => {
    expect(evaluateGuess("banane", "ananas")).toEqual({ exactMatches: 0, misplacedMatches: 4 });
    expect(evaluateGuess("massee", "assess")).toEqual({ exactMatches: 1, misplacedMatches: 3 });
  });

  it("rejects wrong length, invalid words, and repeated guesses", () => {
    const state = createWortcodeState(puzzle);
    const wrongLength = submitWortcodeGuess(puzzle, state, "haus");
    const invalid = submitWortcodeGuess(puzzle, state, "xxxxxx");
    const first = submitWortcodeGuess(puzzle, state, "ananas");
    const repeated = submitWortcodeGuess(puzzle, first.state, "ananas");

    expect(wrongLength.ok).toBe(false);
    expect(invalid.ok).toBe(false);
    expect(first.ok).toBe(true);
    expect(repeated.ok).toBe(false);
    expect(repeated.state.guesses).toHaveLength(1);
  });

  it("wins and loses", () => {
    expect(submitWortcodeGuess(puzzle, createWortcodeState(puzzle), "banane").state.status).toBe("won");

    let state = createWortcodeState({ ...puzzle, maxAttempts: 1 });
    state = submitWortcodeGuess({ ...puzzle, maxAttempts: 1 }, state, "ananas").state;

    expect(state.status).toBe("lost");
  });

  it("keeps curated guesses at the configured length", () => {
    expect(guessWords.every((word) => Array.from(word).length === WORTCODE_WORD_LENGTH)).toBe(true);
  });
});
