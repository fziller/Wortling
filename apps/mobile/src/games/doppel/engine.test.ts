import { describe, expect, it } from "vitest";

import { doppelPuzzles } from "./content";
import { createDoppelState, normalizeDoppelGuess, revealDoppelSolution, submitDoppelGuess, unlockDoppelHint } from "./engine";

describe("doppel engine", () => {
  it("normalizes whitespace and casing without ASCII-folding umlauts", () => {
    expect(normalizeDoppelGuess("  SPIEL ")).toBe("spiel");
    expect(normalizeDoppelGuess(" Tür ")).toBe("tür");
  });

  it("wins with a known solution", () => {
    const puzzle = doppelPuzzles[0];
    const result = submitDoppelGuess(puzzle, createDoppelState(puzzle), "spiel");

    expect(result.ok).toBe(true);
    expect(result.state.status).toBe("won");
  });

  it("does not count the same wrong guess twice", () => {
    const puzzle = doppelPuzzles[0];
    const first = submitDoppelGuess(puzzle, createDoppelState(puzzle), "haus");
    const second = submitDoppelGuess(puzzle, first.state, "haus");

    expect(first.state.guesses).toEqual(["haus"]);
    expect(second.state.guesses).toEqual(["haus"]);
    expect(second.ok).toBe(false);
  });

  it("unlocks hints and reveals without winning", () => {
    const puzzle = doppelPuzzles[0];
    const hinted = unlockDoppelHint(puzzle, createDoppelState(puzzle));
    const revealed = revealDoppelSolution(puzzle, hinted);

    expect(hinted.unlockedHints).toBe(1);
    expect(revealed.status).toBe("revealed");
  });
});
