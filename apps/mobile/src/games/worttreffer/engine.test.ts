import { describe, expect, it } from "vitest";

import { WORTTREFFER_MAX_ATTEMPTS, WORTTREFFER_WORD_LENGTH, guessWords } from "./content";
import { createWorttrefferState, evaluateWorttrefferGuess, getWorttrefferLetterStates, submitWorttrefferGuess } from "./engine";
import { WorttrefferPuzzle } from "./types";

const puzzle: WorttrefferPuzzle = {
  id: "test",
  version: 1,
  answer: "ampel",
  wordLength: WORTTREFFER_WORD_LENGTH,
  maxAttempts: WORTTREFFER_MAX_ATTEMPTS
};

describe("worttreffer engine", () => {
  it("marks exact, present, and absent letters", () => {
    expect(evaluateWorttrefferGuess("ampel", "apfel")).toEqual(["correct", "present", "absent", "correct", "correct"]);
  });

  it("does not reuse answer letters for duplicates", () => {
    expect(evaluateWorttrefferGuess("ampel", "allee")).toEqual(["correct", "present", "absent", "correct", "absent"]);
    expect(evaluateWorttrefferGuess("allee", "ampel")).toEqual(["correct", "absent", "absent", "correct", "present"]);
  });

  it("rejects wrong length, invalid words, and repeated guesses", () => {
    const state = createWorttrefferState(puzzle);
    const wrongLength = submitWorttrefferGuess(puzzle, state, "haus");
    const invalid = submitWorttrefferGuess(puzzle, state, "xxxxx");
    const first = submitWorttrefferGuess(puzzle, state, "apfel");
    const repeated = submitWorttrefferGuess(puzzle, first.state, "apfel");

    expect(wrongLength.ok).toBe(false);
    expect(invalid.ok).toBe(false);
    expect(first.ok).toBe(true);
    expect(repeated.ok).toBe(false);
    expect(repeated.state.guesses).toHaveLength(1);
  });

  it("wins and loses", () => {
    expect(submitWorttrefferGuess(puzzle, createWorttrefferState(puzzle), "ampel").state.status).toBe("won");

    let state = createWorttrefferState({ ...puzzle, maxAttempts: 1 });
    state = submitWorttrefferGuess({ ...puzzle, maxAttempts: 1 }, state, "apfel").state;

    expect(state.status).toBe("lost");
  });

  it("keeps the best keyboard state per letter", () => {
    const state = submitWorttrefferGuess(puzzle, createWorttrefferState(puzzle), "apfel").state;

    expect(getWorttrefferLetterStates(state)).toMatchObject({ a: "correct", p: "present", f: "absent", e: "correct", l: "correct" });
  });

  it("keeps curated guesses at the configured length", () => {
    expect(guessWords.every((word) => Array.from(word).length === WORTTREFFER_WORD_LENGTH)).toBe(true);
  });
});
