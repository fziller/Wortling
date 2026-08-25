import { describe, expect, it } from "vitest";

import { normalizeWord } from "../normalize";

import { computeWordStats } from "./words";

describe("normalizeWord", () => {
  it("trims, lowercases and keeps umlauts native", () => {
    expect(normalizeWord("  STRASSE ")).toBe("strasse");
    expect(normalizeWord("ÄPFEL")).toBe("äpfel");
    expect(normalizeWord("Gruß")).toBe("gruß");
    expect(normalizeWord("schön")).toBe("schön");
  });
});

describe("computeWordStats", () => {
  it("counts words and letters case-insensitively", () => {
    const stats = computeWordStats([
      { normalizedWord: "stein" },
      { normalizedWord: "stein" },
      { normalizedWord: "äpfel" },
    ]);

    expect(stats.totalValidGuesses).toBe(3);
    expect(stats.distinctWords).toBe(2);
    expect(stats.topWords).toEqual([
      { word: "stein", count: 2 },
      { word: "äpfel", count: 1 },
    ]);
    expect(stats.topLetters[0]).toEqual({ word: "e", count: 3 });
    expect(stats.distinctLetters).toBe(9);
    expect(stats.topLetters.map((entry) => entry.word)).toEqual(["e", "i", "n", "s", "t"]);
  });

  it("returns empty aggregates without guesses", () => {
    const stats = computeWordStats([]);

    expect(stats).toMatchObject({ totalValidGuesses: 0, distinctWords: 0, distinctLetters: 0, topWords: [], topLetters: [] });
  });
});
