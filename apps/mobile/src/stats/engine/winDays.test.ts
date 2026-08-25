import { describe, expect, it } from "vitest";

import type { GameOutcome } from "../types";

import { computeWinDays, summarizeWinDays } from "./winDays";

function resolver(dailyByDate: Record<string, string[]>) {
  return (dateKey: string) => dailyByDate[dateKey] ?? [];
}

describe("computeWinDays", () => {
  it("counts a day only when every daily game was won", () => {
    const won = new Map<string, Set<string>>([
      ["2026-08-21", new Set(["a", "b", "c"])],
      ["2026-08-22", new Set(["a", "b"])],
    ]);
    const daily = resolver({ "2026-08-21": ["a", "b", "c"], "2026-08-22": ["a", "b", "d"] });

    expect(computeWinDays(won, daily)).toEqual(["2026-08-21"]);
  });

  it("ignores wins of games that were not part of the day's rotation", () => {
    const won = new Map<string, Set<string>>([["2026-08-21", new Set(["x", "y"])]]);
    const daily = resolver({ "2026-08-21": ["a", "b", "c"] });

    expect(computeWinDays(won, daily)).toEqual([]);
  });
});

type SessionLike = { playDate: string; gameId: string; outcome: GameOutcome | null };

function session(playDate: string, gameId: string, outcome: GameOutcome): SessionLike {
  return { playDate, gameId, outcome };
}

describe("summarizeWinDays", () => {
  const today = "2026-08-23";
  const daily = resolver({
    "2026-08-22": ["a", "b"],
    "2026-08-23": ["a", "b"],
  });

  it("sums current and longest win-day streaks", () => {
    const sessions: SessionLike[] = [
      session("2026-08-22", "a", "won"),
      session("2026-08-22", "b", "won"),
      session("2026-08-23", "a", "won"),
      session("2026-08-23", "b", "won"),
    ];

    expect(summarizeWinDays(sessions, today, daily)).toMatchObject({ current: 2, longest: 2, todayIsWinDay: true });
  });

  it("does not extend the streak into an incomplete previous day", () => {
    const sessions: SessionLike[] = [
      session("2026-08-22", "a", "won"),
      session("2026-08-22", "b", "lost"),
      session("2026-08-23", "a", "won"),
      session("2026-08-23", "b", "won"),
    ];

    expect(summarizeWinDays(sessions, today, daily)).toMatchObject({ current: 1, longest: 1, todayIsWinDay: true });
  });
});
