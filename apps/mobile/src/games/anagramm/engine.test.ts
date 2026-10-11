import { describe, expect, it } from "vitest";

import { createAnagrammPuzzle, getAnagrammDifficulty, restoreAnagrammPuzzle } from "./daily";
import { applyAnagrammHint, createAnagrammState, getAnagrammDraft, getAnagrammHintPosition, placeAnagrammTile, removeAnagrammTile, shuffleAnagrammLetters, submitAnagrammGuess } from "./engine";
import type { AnagrammPuzzle } from "./types";

const puzzle: AnagrammPuzzle = {
  id: "test",
  version: 1,
  answer: "blume",
  shuffledLetters: ["m", "l", "e", "b", "u"],
  acceptedAnswers: ["blume", "bulem"],
  wordLength: 5,
  difficulty: "easy",
  maxAttempts: 5,
};

function placeWord(value: string, source = puzzle) {
  let state = createAnagrammState(source);
  for (const letter of value) {
    const tileIndex = source.shuffledLetters.findIndex((tile, index) => tile === letter && !state.placedTileIndices.includes(index));
    state = placeAnagrammTile(source, state, tileIndex);
  }
  return state;
}

describe("Anagramm engine", () => {
  it("requires a complete tile arrangement before checking", () => {
    const result = submitAnagrammGuess(puzzle, createAnagrammState(puzzle));
    expect(result).toMatchObject({ ok: false, reason: "Setze zuerst alle Buchstaben ein." });
  });

  it("uses each tile at most once and lets placed tiles be removed", () => {
    let state = placeAnagrammTile(puzzle, createAnagrammState(puzzle), 0);
    state = placeAnagrammTile(puzzle, state, 0);
    expect(state.placedTileIndices).toEqual([0, null, null, null, null]);
    expect(removeAnagrammTile(state, 0).placedTileIndices[0]).toBeNull();
  });

  it("handles duplicate letters", () => {
    const repeated: AnagrammPuzzle = { ...puzzle, answer: "allee", shuffledLetters: ["l", "e", "a", "l", "e"], acceptedAnswers: ["allee"] };
    const result = submitAnagrammGuess(repeated, placeWord("allee", repeated));
    expect(result.state.status).toBe("won");
  });

  it("accepts every precomputed valid anagram", () => {
    const result = submitAnagrammGuess(puzzle, placeWord("bulem"));
    expect(result.ok).toBe(true);
    expect(result.state.status).toBe("won");
  });

  it("never presents an unchanged shuffle where another order exists", () => {
    expect(shuffleAnagrammLetters("blume", () => 0.999)).not.toEqual(Array.from("blume"));
  });

  it("fixes only an unresolved position and keeps it immovable", () => {
    const state = createAnagrammState(puzzle);
    const hintPosition = getAnagrammHintPosition(puzzle, state, () => 0);
    const hinted = applyAnagrammHint(puzzle, state, () => 0);
    expect(hintPosition).toBe(0);
    expect(hinted.fixedIndices).toEqual([0]);
    expect(getAnagrammDraft(puzzle, hinted)[0]).toBe("b");
    expect(removeAnagrammTile(hinted, 0)).toEqual(hinted);
  });

  it("moves a misplaced required tile when a hint needs it", () => {
    const state = { ...createAnagrammState(puzzle), placedTileIndices: [0, 3, null, null, null] };
    const hinted = applyAnagrammHint(puzzle, state, () => 0);
    expect(getAnagrammDraft(puzzle, hinted)[0]).toBe("b");
    expect(hinted.placedTileIndices).toContain(null);
  });

  it("records five wrong complete attempts as a loss", () => {
    let state = createAnagrammState(puzzle);
    for (const guess of ["melbu", "melub", "meblu", "mubel", "ulbem"]) {
      state = { ...placeWord(guess), guesses: state.guesses };
      state = submitAnagrammGuess(puzzle, state).state;
    }
    expect(state.status).toBe("lost");
  });

  it("allows a later solve after loss when continuation ignores the limit", () => {
    const lost = { ...placeWord("melbu"), guesses: ["xxxxx", "yyyyy", "zzzzz", "aaaaa"], status: "playing" as const };
    expect(submitAnagrammGuess(puzzle, lost).state.status).toBe("lost");
    const continued = { ...lost, status: "playing" as const };
    expect(submitAnagrammGuess(puzzle, { ...placeWord("blume"), guesses: continued.guesses }, { ignoreAttemptLimit: true }).state.status).toBe("won");
  });

  it("preserves umlauts and ß as single tiles", () => {
    const sharpS = createAnagrammPuzzle("straße", "sharp-s");
    expect(sharpS.wordLength).toBe(6);
    expect(sharpS.shuffledLetters).toHaveLength(6);
  });

  it("restores persisted puzzles and maps length to difficulty", () => {
    expect(getAnagrammDifficulty(4)).toBe("easy");
    expect(getAnagrammDifficulty(6)).toBe("medium");
    expect(getAnagrammDifficulty(8)).toBe("hard");
    expect(restoreAnagrammPuzzle({ id: "saved", answer: "blume", shuffledLetters: ["m", "l", "e", "b", "u"], acceptedAnswers: ["blume"] })).toMatchObject({ id: "saved", wordLength: 5 });
  });
});
