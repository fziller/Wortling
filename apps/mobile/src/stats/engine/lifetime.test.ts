import { describe, expect, it } from "vitest";

import type { GameOutcome, GameSessionRow } from "../types";

import { computeLifetimeStats, computePersonalRecords } from "./lifetime";

function session(overrides: Partial<GameSessionRow> & { outcome?: GameOutcome }): GameSessionRow {
  return {
    id: Math.random().toString(),
    gameId: "wortcode",
    gameVersion: 1,
    playDate: "2026-08-23",
    puzzleId: null,
    startedAt: "2026-08-23T10:00:00.000Z",
    completedAt: null,
    outcome: null,
    wordLength: 5,
    difficulty: null,
    attemptCount: 3,
    hintCount: 0,
    invalidGuessCount: 0,
    duplicateGuessCount: 0,
    activeDurationMs: 60_000,
    createdAt: "2026-08-23T10:00:00.000Z",
    updatedAt: "2026-08-23T10:00:00.000Z",
    schemaVersion: 1,
    ...overrides,
  } as GameSessionRow;
}

describe("computeLifetimeStats", () => {
  it("excludes abandoned rounds from the solved rate", () => {
    const stats = computeLifetimeStats([
      session({ outcome: "won" }),
      session({ outcome: "lost" }),
      session({ outcome: "abandoned" }),
    ]);

    expect(stats.solvedRate).toBeCloseTo(0.5);
    expect(stats.abandoned).toBe(1);
    expect(stats.totalSessions).toBe(3);
  });

  it("finds favorite game and word length", () => {
    const stats = computeLifetimeStats([
      session({ gameId: "doppel", wordLength: null }),
      session({ gameId: "doppel", wordLength: null }),
      session({ gameId: "wortcode", wordLength: 6 }),
    ]);

    expect(stats.favoriteGameId).toBe("doppel");
    expect(stats.gamesByWordLength).toEqual({ 6: 1 });
    expect(stats.favoriteWordLength).toBe(6);
  });

  it("averages attempts across decided sessions only", () => {
    const stats = computeLifetimeStats([
      session({ outcome: "won", attemptCount: 2 }),
      session({ outcome: "lost", attemptCount: 4 }),
      session({ outcome: "abandoned", attemptCount: 99 }),
    ]);

    expect(stats.avgAttempts).toBe(3);
    expect(stats.medianAttempts).toBe(3);
  });
});

describe("computePersonalRecords", () => {
  it("tracks day records and fastest win", () => {
    const records = computePersonalRecords([
      session({ playDate: "2026-08-21", outcome: "won", activeDurationMs: 90_000 }),
      session({ playDate: "2026-08-22", outcome: "won", activeDurationMs: 45_000 }),
      session({ playDate: "2026-08-22", outcome: "won", activeDurationMs: 120_000 }),
      session({ playDate: "2026-08-22", outcome: "abandoned" }),
    ]);

    expect(records.fastestWinMs).toBe(45_000);
    expect(records.mostGamesInADay).toBe(3);
    expect(records.mostWinsInADay).toBe(2);
  });

  it("stays null without data", () => {
    expect(computePersonalRecords([])).toMatchObject({
      fastestWinMs: null,
      fewestAttemptsWin: null,
      mostGamesInADay: null,
      mostWinsInADay: null,
    });
  });
});
