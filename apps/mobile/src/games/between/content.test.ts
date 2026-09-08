import { describe, expect, it } from "vitest";

import { allowedGuesses, targetWords, WORD_LENGTH } from "./content";
import { getOpenAlphabetLetters } from "./engine";

describe("between content", () => {
  it("keeps target words playable as guesses", () => {
    const allowedGuessSet = new Set(allowedGuesses);

    expect(targetWords.every((word) => allowedGuessSet.has(word))).toBe(true);
    expect(allowedGuesses.every((word) => Array.from(word).length === WORD_LENGTH)).toBe(true);
  });

  it("shows umlauts in the open alphabet", () => {
    expect(getOpenAlphabetLetters("aaaaa", "zzzzz", 0)).toEqual(expect.arrayContaining(["Ä", "Ö", "Ü"]));
  });
});
