import { afterEach, describe, expect, it, vi } from "vitest";

import { pickRandomTargetWord, pickRandomWordLength, supportedWordLengths } from "./wordLengths";

describe("word length randomization", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("only picks supported word lengths", () => {
    for (const roll of [0, 0.44, 0.45, 0.79, 0.8, 0.99]) {
      vi.spyOn(Math, "random").mockReturnValueOnce(roll);

      expect(supportedWordLengths).toContain(pickRandomWordLength());
    }
  });

  it("respects available lengths and weighted buckets", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0.99);
    expect(pickRandomWordLength([6])).toBe(6);

    vi.spyOn(Math, "random").mockReturnValueOnce(0.1);
    expect(pickRandomWordLength()).toBe(5);

    vi.spyOn(Math, "random").mockReturnValueOnce(0.7);
    expect(pickRandomWordLength()).toBe(6);

    vi.spyOn(Math, "random").mockReturnValueOnce(0.9);
    expect(pickRandomWordLength()).toBe(7);
  });

  it("supports custom 4-letter weighting for games that opt in", () => {
    const weights = [
      { length: 4, weight: 15 },
      { length: 5, weight: 40 },
      { length: 6, weight: 30 },
      { length: 7, weight: 15 },
    ] as const;

    vi.spyOn(Math, "random").mockReturnValueOnce(0.14);
    expect(pickRandomWordLength([4, 5, 6, 7], weights)).toBe(4);

    vi.spyOn(Math, "random").mockReturnValueOnce(0.99);
    expect(pickRandomWordLength([4, 5, 6, 7], weights)).toBe(7);
  });

  it("uses the matching target list and ignores wrong-length targets", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    expect(pickRandomTargetWord({ 6: ["ampel", "banane"] })).toEqual({ answer: "banane", wordLength: 6 });
  });

  it("falls back to available target lengths", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);

    expect(pickRandomTargetWord({ 7: ["abstand"] })).toEqual({ answer: "abstand", wordLength: 7 });
  });
});
