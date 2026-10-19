import { describe, expect, it } from "vitest";

import { createNextSilbenmixGame } from "./daily";

describe("Silbenmix daily selection", () => {
  it.each([
    [0.34, 3],
    [0.35, 4],
    [0.69, 4],
    [0.7, 5],
  ])("selects %i as a %i-word profile", (roll, wordCount) => {
    const game = createNextSilbenmixGame(undefined, "test", () => roll);

    expect(game.puzzle.targets).toHaveLength(wordCount);
  });
});
