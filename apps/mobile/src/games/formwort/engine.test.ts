import { describe, expect, it } from "vitest";

import { getWordLength, supportedWordLengths } from "../wordLengths";

import { formwortGuessWords, formwortTargetsByLength } from "./content";
import { createFormwortPuzzle, getFormwortMaxAttempts, restoreFormwortPuzzle } from "./daily";
import { applyFormwortInputLetter, createFormwortState, createFormwortSymbols, removeFormwortInputLetter, submitFormwortGuess } from "./engine";

const puzzle = createFormwortPuzzle("allee", 5, "test");

describe("formwort engine", () => {
  it("uses the same symbol for repeated letters", () => {
    expect(createFormwortSymbols("allee")).toEqual(["◆", "◼", "◼", "▲", "▲"]);
    expect(createFormwortSymbols("brunnen")).toEqual(["◆", "◼", "▲", "●", "●", "⬢", "●"]);
  });

  it("fills repeated shapes together", () => {
    const result = applyFormwortInputLetter(puzzle.symbols, ["", "", "", "", ""], 1, "l");

    expect(result.letters).toEqual(["", "l", "l", "", ""]);
    expect(result.cursorIndex).toBe(3);
  });

  it("removes repeated shapes together", () => {
    const result = removeFormwortInputLetter(puzzle.symbols, ["a", "l", "l", "", ""], 2);

    expect(result.letters).toEqual(["a", "", "", "", ""]);
    expect(result.cursorIndex).toBe(2);
  });

  it("submits guesses with wordle feedback", () => {
    const result = submitFormwortGuess(puzzle, createFormwortState(puzzle), "apfel");

    expect(result.ok).toBe(true);
    expect(result.state.guesses[0].marks).toEqual(["correct", "absent", "absent", "correct", "present"]);
  });

  it("wins and rejects repeated guesses", () => {
    const won = submitFormwortGuess(puzzle, createFormwortState(puzzle), "allee");
    const repeated = submitFormwortGuess(puzzle, won.state, "allee");

    expect(won.state.status).toBe("won");
    expect(repeated.ok).toBe(false);
  });

  it("supports configured word lengths and attempts", () => {
    const cases = [
      [5, "allee", 6],
      [6, "banane", 7],
      [7, "brunnen", 8],
    ] as const;

    for (const [wordLength, answer, maxAttempts] of cases) {
      const nextPuzzle = createFormwortPuzzle(answer, wordLength, `test-${wordLength}`);
      const result = submitFormwortGuess(nextPuzzle, createFormwortState(nextPuzzle), answer);

      expect(nextPuzzle.maxAttempts).toBe(maxAttempts);
      expect(getFormwortMaxAttempts(wordLength)).toBe(maxAttempts);
      expect(result.state.status).toBe("won");
      expect(result.state.guesses[0].marks).toHaveLength(wordLength);
    }
  });

  it("keeps guesses at the configured length", () => {
    expect(formwortGuessWords.every((word) => supportedWordLengths.some((length) => length === getWordLength(word)))).toBe(true);
    for (const length of [5, 6, 7] as const) {
      expect(formwortTargetsByLength[length]?.every((word) => getWordLength(word) === length)).toBe(true);
    }
  });

  it("restores old persisted puzzles without wordLength", () => {
    expect(restoreFormwortPuzzle({ id: "old", version: 1, answer: "allee", maxAttempts: 6 })).toMatchObject({ wordLength: 5, maxAttempts: 6 });
    expect(restoreFormwortPuzzle({ id: "bad", answer: "haus" })).toBeNull();
  });
});
