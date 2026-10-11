import { describe, expect, it } from "vitest";

import { computeAnagrammStats } from "./anagramm";
import type { GameSessionRow } from "../types";

function session(overrides: Partial<GameSessionRow>): GameSessionRow {
  return {
    id: "id", gameId: "anagramm", gameVersion: 1, playDate: "2026-10-11", puzzleId: "p", startedAt: "2026-10-11T10:00:00.000Z", completedAt: "2026-10-11T10:01:00.000Z", outcome: "won", wordLength: 5, difficulty: "easy", attemptCount: 2, hintCount: 1, invalidGuessCount: 0, duplicateGuessCount: 0, activeDurationMs: 60_000, continuedAfterLoss: false, solvedAfterLoss: false, officialLossAttemptCount: null, postLossCompletion: null, createdAt: "2026-10-11T10:00:00.000Z", updatedAt: "2026-10-11T10:01:00.000Z", schemaVersion: 2,
    ...overrides,
  };
}

describe("Anagramm stats", () => {
  it("derives free metrics from local session data", () => {
    const stats = computeAnagrammStats([
      session({ outcome: "won", wordLength: 8, attemptCount: 2, hintCount: 1, activeDurationMs: 60_000 }),
      session({ id: "two", outcome: "lost", wordLength: 4, attemptCount: 5, hintCount: 0, activeDurationMs: 30_000 }),
      session({ id: "other", gameId: "worttreffer" }),
    ]);
    expect(stats).toMatchObject({ rounds: 2, solvedRate: 0.5, averageWrongAttempts: 3, averageHints: 0.5, longestSolvedWordLength: 8 });
  });
});
