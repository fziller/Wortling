import { describe, expect, it } from "vitest";

import { allowedGuesses } from "./content";
import { getOpenAlphabetLetters, getTargetRangeMetrics } from "./engine";
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
    expect(getOpenAlphabetLetters("insel", "kuppe", 0)).toEqual(["J"]);
    expect(getOpenAlphabetLetters("insel", "kuppe", 1, ["j", "", "", "", ""])).toEqual("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""));
    expect(getOpenAlphabetLetters("insel", "kuppe", 1, ["a", "", "", "", ""])).toEqual([]);
  });
});
