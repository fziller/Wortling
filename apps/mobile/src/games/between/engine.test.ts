import { describe, expect, it } from "vitest";

import { allowedGuesses } from "./content";
import { applyBetweenHint, getBetweenRevealedHintLetters, getOpenAlphabetLetters, getTargetRangeMetrics } from "./engine";
import type { BetweenState } from "./types";

describe("between engine", () => {
  it("counts words between the bounds and target", () => {
    const state: BetweenState = {
      targetWord: allowedGuesses[15],
      lowerBound: allowedGuesses[10],
      upperBound: allowedGuesses[20],
      guesses: [],
      status: "playing"
    };

    expect(getTargetRangeMetrics(state)).toMatchObject({
      topDistanceWords: 4,
      bottomDistanceWords: 4,
      remainingWords: 9
    });
  });

  it("shows available letters for the active input position", () => {
    expect(getOpenAlphabetLetters("insel", "kuppe", 0)).toEqual(["I", "J", "K"]);
    expect(getOpenAlphabetLetters("hanau", "insel", 0)).toEqual(["H", "I"]);
    expect(getOpenAlphabetLetters("insel", "kuppe", 1, ["j", "", "", "", ""])).toEqual("AÄBCDEFGHIJKLMNOÖPQRSTUÜVWXYZ".split(""));
    expect(getOpenAlphabetLetters("insel", "kuppe", 1, ["a", "", "", "", ""])).toEqual([]);
    expect(getOpenAlphabetLetters("hanau", "hanaw", 4, ["h", "a", "n", "a", ""])).toEqual(["V"]);
  });

  it("adds random hint positions without repeating them", () => {
    const random = Math.random;
    Math.random = () => 0;
    try {
      const state = applyBetweenHint({ targetWord: "insel", lowerBound: "aaaaa", upperBound: "zzzzz", guesses: [], status: "playing" });
      const next = applyBetweenHint(state);

      expect(state.revealedHintIndices).toEqual([0]);
      expect(next.revealedHintIndices).toEqual([0, 1]);
      expect(getBetweenRevealedHintLetters(next)).toEqual(["i", "n", null, null, null]);
    } finally {
      Math.random = random;
    }
  });
});
