import { describe, expect, it } from "vitest";

import { getWordLength, supportedWordLengths } from "../wordLengths";

import { guessWords, wortcodeTargetsByLength } from "./content";
import { createWortcodePuzzle, getWortcodeDifficulty, getWortcodeMaxAttempts, restoreWortcodePuzzle } from "./daily";
import { createWortcodeState, evaluateGuess, submitWortcodeGuess, toggleWortcodeLetterMark } from "./engine";

const puzzle = createWortcodePuzzle("banane", 6, "test");

describe("wortcode engine", () => {
  it("scores exact matches", () => {
    expect(evaluateGuess("banane", "banane")).toEqual({ exactMatches: 6, misplacedMatches: 0 });
    expect(evaluateGuess("ampel", "ampel")).toEqual({ exactMatches: 5, misplacedMatches: 0 });
    expect(evaluateGuess("abstand", "abstand")).toEqual({ exactMatches: 7, misplacedMatches: 0 });
  });

  it("handles duplicate letters without reusing target letters", () => {
    expect(evaluateGuess("banane", "ananas")).toEqual({ exactMatches: 0, misplacedMatches: 4 });
    expect(evaluateGuess("massee", "assess")).toEqual({ exactMatches: 1, misplacedMatches: 3 });
    expect(evaluateGuess("ballast", "abstand")).toEqual({ exactMatches: 1, misplacedMatches: 4 });
  });

  it("supports configured word lengths, attempts, and difficulty", () => {
    const cases = [
      [5, "ampel", 7, "easy"],
      [6, "banane", 8, "medium"],
      [7, "abstand", 9, "hard"],
    ] as const;

    for (const [wordLength, answer, maxAttempts, difficulty] of cases) {
      const nextPuzzle = createWortcodePuzzle(answer, wordLength, `test-${wordLength}`);
      const result = submitWortcodeGuess(nextPuzzle, createWortcodeState(nextPuzzle), answer);

      expect(nextPuzzle.maxAttempts).toBe(maxAttempts);
      expect(nextPuzzle.difficulty).toBe(difficulty);
      expect(getWortcodeMaxAttempts(wordLength)).toBe(maxAttempts);
      expect(getWortcodeDifficulty(wordLength)).toBe(difficulty);
      expect(result.state.status).toBe("won");
    }
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
    expect(guessWords.every((word) => supportedWordLengths.some((length) => length === getWordLength(word)))).toBe(true);
    for (const length of [5, 6, 7] as const) {
      expect(wortcodeTargetsByLength[length]?.every((word) => getWordLength(word) === length)).toBe(true);
    }
  });

  it("toggles manual letter marks without changing scoring", () => {
    const guessed = submitWortcodeGuess(puzzle, createWortcodeState(puzzle), "ananas").state;
    const included = toggleWortcodeLetterMark(guessed, 0, 1);
    const exact = toggleWortcodeLetterMark(included, 0, 1);
    const cleared = toggleWortcodeLetterMark(exact, 0, 1);

    expect(included.guesses[0].marks?.[1]).toBe("included");
    expect(exact.guesses[0].marks?.[1]).toBe("exact");
    expect(cleared.guesses[0].marks?.[1]).toBe("none");
    expect(cleared.guesses[0].exactMatches).toBe(0);
    expect(toggleWortcodeLetterMark(cleared, 99, 0)).toBe(cleared);
  });

  it("restores old persisted puzzles without wordLength", () => {
    expect(restoreWortcodePuzzle({ id: "old", version: 1, answer: "banane", maxAttempts: 8, difficulty: "medium" })).toMatchObject({ wordLength: 6, maxAttempts: 8 });
    expect(restoreWortcodePuzzle({ id: "bad", answer: "haus" })).toBeNull();
  });
});
