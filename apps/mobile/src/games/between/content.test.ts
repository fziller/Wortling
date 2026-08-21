import { describe, expect, it } from "vitest";

import { allowedGuesses, targetWords, WORD_LENGTH } from "./content";

describe("between content", () => {
  it("keeps target words playable as guesses", () => {
    const allowedGuessSet = new Set(allowedGuesses);

    expect(targetWords.every((word) => allowedGuessSet.has(word))).toBe(true);
    expect(allowedGuesses.every((word) => Array.from(word).length === WORD_LENGTH)).toBe(true);
  });
});
