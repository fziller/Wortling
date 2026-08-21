import { describe, expect, it } from "vitest";

import type { GameDefinition } from "@/games/types";
import type { StoredProgress } from "@/storage/progress";

import {
  DAILY_KNIFFE_COUNT,
  createDailyKniffeSeed,
  generateDailyKniffe,
  getDailyKniffeSummary,
  isDailyKniffCompleted,
} from "./index";

const testGames = [
  game("a", true),
  game("b", true),
  game("c", true),
  game("d", true),
  game("e", false),
] as const;

describe("daily kniffe", () => {
  it("generates exactly three quests without duplicates", () => {
    const kniffe = generateDailyKniffe({ dateKey: "2026-08-21", games: testGames });
    const gameIds = kniffe.map((kniff) => kniff.gameId);

    expect(kniffe).toHaveLength(DAILY_KNIFFE_COUNT);
    expect(new Set(gameIds).size).toBe(DAILY_KNIFFE_COUNT);
  });

  it("only uses eligible games", () => {
    const kniffe = generateDailyKniffe({ dateKey: "2026-08-21", games: testGames });

    expect(kniffe.every((kniff) => kniff.gameId !== "e")).toBe(true);
  });

  it("keeps the same day and version stable", () => {
    const first = generateDailyKniffe({ dateKey: "2026-08-21", games: testGames, rotationVersion: 1 });
    const second = generateDailyKniffe({ dateKey: "2026-08-21", games: testGames, rotationVersion: 1 });

    expect(second).toEqual(first);
  });

  it("allows seed overrides", () => {
    const production = generateDailyKniffe({ dateKey: "2026-08-21", games: testGames });
    const override = generateDailyKniffe({ dateKey: "2026-08-21", games: testGames, devConfig: { seedOverride: 12345 } });

    expect(override).toEqual(generateDailyKniffe({ dateKey: "2026-08-21", games: testGames, devConfig: { seedOverride: 12345 } }));
    expect(override.map((kniff) => kniff.gameId).join(",")).not.toEqual(production.map((kniff) => kniff.gameId).join(","));
  });

  it("changes the seed by date and rotation version", () => {
    expect(createDailyKniffeSeed("2026-08-21", 1)).not.toBe(createDailyKniffeSeed("2026-08-22", 1));
    expect(createDailyKniffeSeed("2026-08-21", 1)).not.toBe(createDailyKniffeSeed("2026-08-21", 2));
  });

  it("handles fewer than three eligible games without crashing", () => {
    const kniffe = generateDailyKniffe({ dateKey: "2026-08-21", games: [game("a", true), game("b", false)] });

    expect(kniffe).toHaveLength(1);
    expect(kniffe[0].gameId).toBe("a");
  });

  it.each(["won", "lost", "revealed"] as const)("treats %s as completed", (status) => {
    expect(isDailyKniffCompleted(progress(status))).toBe(true);
  });

  it.each(["playing", "not_started"] as const)("does not treat %s as completed", (status) => {
    expect(isDailyKniffCompleted(progress(status))).toBe(false);
  });

  it("summarizes 0/3, 1/3, 2/3, and 3/3", () => {
    const kniffe = generateDailyKniffe({ dateKey: "2026-08-21", games: testGames });
    const [first, second, third] = kniffe;

    expect(getDailyKniffeSummary(kniffe, {}).completed).toBe(0);
    expect(getDailyKniffeSummary(kniffe, { [first.gameId]: progress("won") }).completed).toBe(1);
    expect(getDailyKniffeSummary(kniffe, { [first.gameId]: progress("won"), [second.gameId]: progress("lost") }).completed).toBe(2);
    expect(getDailyKniffeSummary(kniffe, { [first.gameId]: progress("won"), [second.gameId]: progress("lost"), [third.gameId]: progress("revealed") })).toEqual({ total: 3, completed: 3, isComplete: true });
  });
});

function game(id: string, dailyKniffEligible: boolean): GameDefinition {
  return {
    id,
    title: id,
    shortDescription: id,
    route: `/games/${id}`,
    estimatedMinutes: 1,
    badge: id,
    dailyKniffEligible,
  };
}

function progress(status: StoredProgress["status"]): StoredProgress {
  return {
    gameId: "game",
    dateKey: "2026-08-21",
    puzzleId: "puzzle",
    puzzleVersion: 1,
    status,
    state: {},
  };
}
