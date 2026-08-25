import type { GameOutcome } from "../types";

import { computeStreaks, type StreakSummary } from "./streaks";

// A day counts as fully solved when every daily-kniff game assigned to that
// date has at least one won session on that date.
export function computeWinDays(
  wonGameIdsByDate: ReadonlyMap<string, ReadonlySet<string>>,
  resolveDailyGameIds: (dateKey: string) => Iterable<string>,
): string[] {
  const winDays: string[] = [];

  for (const [dateKey, wonGameIds] of wonGameIdsByDate) {
    const isComplete = [...resolveDailyGameIds(dateKey)].every((gameId) => wonGameIds.has(gameId));

    if (isComplete) winDays.push(dateKey);
  }

  return winDays.sort();
}

export function summarizeWinDays(
  sessions: readonly { playDate: string; gameId: string; outcome: GameOutcome | null }[],
  todayKey: string,
  resolveDailyGameIds: (dateKey: string) => Iterable<string>,
): StreakSummary & { todayIsWinDay: boolean } {
  const wonGameIdsByDate = new Map<string, Set<string>>();

  for (const session of sessions) {
    if (session.outcome !== "won") continue;

    const gameIds = wonGameIdsByDate.get(session.playDate) ?? new Set<string>();
    gameIds.add(session.gameId);
    wonGameIdsByDate.set(session.playDate, gameIds);
  }

  const winDays = computeWinDays(wonGameIdsByDate, resolveDailyGameIds);

  return {
    ...computeStreaks(winDays, todayKey),
    todayIsWinDay: winDays.includes(todayKey),
  };
}
