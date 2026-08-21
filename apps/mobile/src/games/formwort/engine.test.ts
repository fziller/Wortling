import { describe, expect, it } from "vitest";

import { FORMWORT_MAX_ATTEMPTS, FORMWORT_WORD_LENGTH, formwortGuessWords } from "./content";
import { createFormwortState, createFormwortSymbols, submitFormwortGuess } from "./engine";
import type { FormwortPuzzle } from "./types";

const puzzle: FormwortPuzzle = {
  id: "test",
  version: 1,
  answer: "allee",
  wordLength: FORMWORT_WORD_LENGTH,
  maxAttempts: FORMWORT_MAX_ATTEMPTS,
  symbols: createFormwortSymbols("allee")
};

describe("formwort engine", () => {
  it("uses the same symbol for repeated letters", () => {
    expect(createFormwortSymbols("allee")).toEqual(["◆", "◼", "◼", "▲", "▲"]);
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

  it("keeps guesses at the configured length", () => {
    expect(formwortGuessWords.every((word) => Array.from(word).length === FORMWORT_WORD_LENGTH)).toBe(true);
  });
});
