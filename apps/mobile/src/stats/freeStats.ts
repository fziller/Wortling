import { getBerlinDateKey } from "@/daily/date";
import { generateDailyKniffe } from "@/dailyKniffe";
import { games } from "@/games/registry";

import { computeLifetimeStats, computePersonalRecords, type LifetimeStats, type PersonalRecords } from "./engine/lifetime";
import { computeStreaks, type StreakSummary } from "./engine/streaks";
import { summarizeWinDays } from "./engine/winDays";
import { computeWordStats, type WordStats } from "./engine/words";
import { computeAnagrammStats, type AnagrammStats } from "./engine/anagramm";
import { computeSilbenmixStats, type SilbenmixStats } from "./engine/silbenmix";
import { getAllSessions, getGameGuessData, getRecentSessions, getValidWordGuesses } from "./repository";
import type { GameSessionRow } from "./types";

export type FreeStats = {
  activityStreak: StreakSummary;
  winDayStreak: StreakSummary;
  lifetime: LifetimeStats;
  words: WordStats;
  records: PersonalRecords;
  anagramm: AnagrammStats;
  silbenmix: SilbenmixStats;
  recent: GameSessionRow[];
};

export async function loadFreeStats(todayKey = getBerlinDateKey()): Promise<FreeStats> {
  const [sessions, guesses, silbenmixGuesses, recent] = await Promise.all([getAllSessions(), getValidWordGuesses(), getGameGuessData("silbenmix"), getRecentSessions(5)]);

  return {
    activityStreak: computeStreaks(sessions.map((session) => session.playDate), todayKey),
    winDayStreak: summarizeWinDays(sessions, todayKey, resolveDailyGameIds),
    lifetime: computeLifetimeStats(sessions),
    words: computeWordStats(guesses),
    records: computePersonalRecords(sessions),
    anagramm: computeAnagrammStats(sessions),
    silbenmix: computeSilbenmixStats(sessions, silbenmixGuesses),
    recent,
  };
}

export async function loadCurrentWinDayStreak(todayKey = getBerlinDateKey()): Promise<StreakSummary & { todayIsWinDay: boolean }> {
  const sessions = await getAllSessions();

  return summarizeWinDays(sessions, todayKey, resolveDailyGameIds);
}

function resolveDailyGameIds(dateKey: string): string[] {
  return generateDailyKniffe({ dateKey, games }).map((kniff) => kniff.gameId);
}
