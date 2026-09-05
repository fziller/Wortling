import { describe, expect, it } from "vitest";

import { getWordLength, supportedWordLengths } from "../wordLengths";

import { guessWords, worttrefferTargetsByLength } from "./content";
import { createWorttrefferPuzzle, getWorttrefferMaxAttempts, restoreWorttrefferPuzzle } from "./daily";
import { createWorttrefferState, evaluateWorttrefferGuess, getWorttrefferHintPosition, getWorttrefferLetterStates, submitWorttrefferGuess } from "./engine";
import type { WorttrefferState } from "./types";

const puzzle = createWorttrefferPuzzle("ampel", 5, "test");

describe("worttreffer engine", () => {
  it("marks exact, present, and absent letters", () => {
    expect(evaluateWorttrefferGuess("ampel", "apfel")).toEqual(["correct", "present", "absent", "correct", "correct"]);
  });

  it("does not reuse answer letters for duplicates", () => {
    expect(evaluateWorttrefferGuess("ampel", "allee")).toEqual(["correct", "present", "absent", "correct", "absent"]);
    expect(evaluateWorttrefferGuess("allee", "ampel")).toEqual(["correct", "absent", "absent", "correct", "present"]);
    expect(evaluateWorttrefferGuess("ballast", "abstand")).toEqual(["present", "present", "present", "present", "correct", "absent", "absent"]);
  });

  it("supports configured word lengths and attempts", () => {
    const cases = [
      [4, "haus", 5],
      [5, "ampel", 6],
      [6, "banane", 7],
      [7, "abstand", 8],
    ] as const;

    for (const [wordLength, answer, maxAttempts] of cases) {
      const nextPuzzle = createWorttrefferPuzzle(answer, wordLength, `test-${wordLength}`);
      const result = submitWorttrefferGuess(nextPuzzle, createWorttrefferState(nextPuzzle), answer);

      expect(nextPuzzle.maxAttempts).toBe(maxAttempts);
      expect(getWorttrefferMaxAttempts(wordLength)).toBe(maxAttempts);
      expect(result.state.status).toBe("won");
    }
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

  it("does not reveal positions already found exactly", () => {
    const state: WorttrefferState = {
      ...createWorttrefferState(puzzle),
      guesses: [{ value: "allee", marks: ["absent", "absent", "absent", "absent", "correct"] }],
      revealedIndices: [0, 1, 2],
    };

    expect(getWorttrefferHintPosition(puzzle, state)).toBe(3);
  });

  it("keeps curated guesses at the configured length", () => {
    expect(guessWords.every((word) => supportedWordLengths.some((length) => length === getWordLength(word)))).toBe(true);
    for (const length of supportedWordLengths) {
      expect(worttrefferTargetsByLength[length]?.every((word) => getWordLength(word) === length)).toBe(true);
    }
  });

  it("restores old persisted puzzles without wordLength", () => {
    expect(restoreWorttrefferPuzzle({ id: "old", version: 1, answer: "ampel", maxAttempts: 6 })).toMatchObject({ wordLength: 5, maxAttempts: 6 });
    expect(restoreWorttrefferPuzzle({ id: "old-4", version: 2, answer: "haus" })).toMatchObject({ wordLength: 4, maxAttempts: 5 });
    expect(restoreWorttrefferPuzzle({ id: "bad", answer: "tag" })).toBeNull();
  });
});
