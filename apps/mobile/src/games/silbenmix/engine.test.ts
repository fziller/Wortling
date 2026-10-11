import { describe, expect, it } from "vitest";

import { applySilbenmixPairHint, applySilbenmixStartHint, createSilbenmixState, getSilbenmixDraft, removeSilbenmixTile, revealSilbenmixWord, selectSilbenmixTile, submitSilbenmixWord } from "./engine";
import type { SilbenmixPuzzle } from "./types";

const puzzle: SilbenmixPuzzle = {
  id: "test",
  version: 1,
  difficulty: "medium",
  syllableCount: 7,
  targets: [
    { id: "zitrone", word: "zitrone", syllables: ["zi", "tro", "ne"] },
    { id: "banane", word: "banane", syllables: ["ba", "na", "ne"] },
    { id: "tomate", word: "tomate", syllables: ["to", "ma", "te"] },
  ],
  tiles: [
    { id: "ne-1", syllable: "ne" }, { id: "zi", syllable: "zi" }, { id: "tro", syllable: "tro" },
    { id: "ba", syllable: "ba" }, { id: "na", syllable: "na" }, { id: "ne-2", syllable: "ne" },
    { id: "to", syllable: "to" }, { id: "ma", syllable: "ma" }, { id: "te", syllable: "te" },
  ],
};

describe("Silbenmix engine", () => {
  it("keeps duplicate syllables distinct and lets a selected tile return to the pool", () => {
    let state = createSilbenmixState(puzzle);
    state = selectSilbenmixTile(puzzle, state, "ne-1");
    state = selectSilbenmixTile(puzzle, state, "ne-2");
    expect(state.selectedTileIds).toEqual(["ne-1", "ne-2"]);
    state = removeSilbenmixTile(state, "ne-1");
    expect(state.selectedTileIds).toEqual(["ne-2"]);
    expect(selectSilbenmixTile(puzzle, state, "ne-1").selectedTileIds).toEqual(["ne-2", "ne-1"]);
  });

  it("accepts a correct word, removes exactly its tiles, and rejects a wrong combination", () => {
    let state = createSilbenmixState(puzzle);
    for (const tileId of ["zi", "tro", "ne-1"]) state = selectSilbenmixTile(puzzle, state, tileId);
    expect(getSilbenmixDraft(puzzle, state)).toBe("zitrone");
    const correct = submitSilbenmixWord(puzzle, state);
    expect(correct.ok).toBe(true);
    if (!correct.ok) return;
    expect(correct.state.solvedTargetIds).toEqual(["zitrone"]);
    expect(correct.state.usedTileIds).toEqual(["zi", "tro", "ne-1"]);

    let wrongState = createSilbenmixState(puzzle);
    for (const tileId of ["ba", "ne-1", "na"]) wrongState = selectSilbenmixTile(puzzle, wrongState, tileId);
    const wrong = submitSilbenmixWord(puzzle, wrongState);
    expect(wrong.ok).toBe(false);
    expect(wrong.state.selectedTileIds).toEqual(["ba", "ne-1", "na"]);
  });

  it("progresses across words and marks a final revealed round as revealed", () => {
    let state = createSilbenmixState(puzzle);
    state = revealSilbenmixWord(puzzle, state);
    expect(state.revealedTargetIds).toEqual(["zitrone"]);
    expect(state.status).toBe("playing");
    state = revealSilbenmixWord(puzzle, state);
    state = revealSilbenmixWord(puzzle, state);
    expect(state.status).toBe("revealed");
  });

  it("marks start syllables and consecutive pairs without consuming them", () => {
    const state = createSilbenmixState(puzzle);
    const start = applySilbenmixStartHint(puzzle, state);
    expect(start.hintedTileIds).toEqual(["zi"]);
    const pair = applySilbenmixPairHint(puzzle, start);
    expect(pair.hintedTileIds).toEqual(["zi", "tro"]);
    expect(pair.usedTileIds).toEqual([]);
  });

  it("keeps an in-progress round serializable for local restore", () => {
    let state = createSilbenmixState(puzzle);
    state = selectSilbenmixTile(puzzle, state, "ba");
    state = applySilbenmixStartHint(puzzle, state);
    const restored = JSON.parse(JSON.stringify(state)) as typeof state;
    expect(getSilbenmixDraft(puzzle, restored)).toBe("ba");
    expect(restored.hintedTileIds).toEqual(["zi"]);
  });
});
