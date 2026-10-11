import { describe, expect, it } from "vitest";
import { computeSilbenmixStats } from "./silbenmix";

const base = { gameId: "silbenmix", gameVersion: 1, playDate: "2026-10-11", puzzleId: "p", startedAt: "2026-10-11T10:00:00.000Z", completedAt: "2026-10-11T10:01:00.000Z", wordLength: null, difficulty: "medium", hintCount: 1, invalidGuessCount: 0, duplicateGuessCount: 0, continuedAfterLoss: false, solvedAfterLoss: false, officialLossAttemptCount: null, postLossCompletion: null, createdAt: "2026-10-11T10:00:00.000Z", updatedAt: "2026-10-11T10:01:00.000Z", schemaVersion: 2 } as const;

describe("Silbenmix stats", () => {
  it("derives free metrics from central raw session and guess data", () => {
    const stats = computeSilbenmixStats([{ ...base, id: "won", outcome: "won", attemptCount: 3, activeDurationMs: 60_000 }, { ...base, id: "revealed", outcome: "revealed", attemptCount: 1, activeDurationMs: 30_000 }], [{ sessionId: "won", gameData: { targetWords: 3, syllableCount: 9 } }]);
    expect(stats).toMatchObject({ rounds: 2, solvedRate: 0.5, totalSelfFoundWords: 4, averageActiveMs: 45_000, averageHints: 1, largestSolvedRound: 3 });
  });
});
