import type { GameSessionRow } from "../types";

export type GameCount = { gameId: string; sessions: number; won: number };

export type LifetimeStats = {
  totalSessions: number;
  won: number;
  lost: number;
  revealed: number;
  abandoned: number;
  solvedRate: number | null;
  playedDays: number;
  totalActiveMs: number;
  avgActiveMsPerSession: number | null;
  avgAttempts: number | null;
  medianAttempts: number | null;
  avgHints: number | null;
  favoriteGameId: string | null;
  perGame: GameCount[];
  gamesByWordLength: Record<number, number>;
  favoriteWordLength: number | null;
};

export type PersonalRecords = {
  fastestWinMs: number | null;
  fewestAttemptsWin: number | null;
  mostGamesInADay: number | null;
  mostWinsInADay: number | null;
};

export function computeLifetimeStats(sessions: readonly GameSessionRow[]): LifetimeStats {
  const decided = sessions.filter((session) => session.outcome === "won" || session.outcome === "lost" || session.outcome === "revealed");
  const wonSessions = decided.filter((session) => session.outcome === "won");

  const totalActiveMs = sessions.reduce((sum, session) => sum + session.activeDurationMs, 0);
  const playedDays = new Set(sessions.map((session) => session.playDate)).size;

  const attemptsOfDecided = decided.map((session) => session.attemptCount);
  const hintsOfDecided = decided.map((session) => session.hintCount);

  const perGameMap = new Map<string, GameCount>();
  for (const session of sessions) {
    const entry = perGameMap.get(session.gameId) ?? { gameId: session.gameId, sessions: 0, won: 0 };
    entry.sessions += 1;
    if (session.outcome === "won") entry.won += 1;
    perGameMap.set(session.gameId, entry);
  }
  const perGame = [...perGameMap.values()].sort((a, b) => b.sessions - a.sessions || a.gameId.localeCompare(b.gameId));

  const byWordLength: Record<number, number> = {};
  for (const session of sessions) {
    if (session.wordLength === null) continue;
    byWordLength[session.wordLength] = (byWordLength[session.wordLength] ?? 0) + 1;
  }

  return {
    totalSessions: sessions.length,
    won: wonSessions.length,
    lost: decided.filter((session) => session.outcome === "lost").length,
    revealed: decided.filter((session) => session.outcome === "revealed").length,
    abandoned: sessions.filter((session) => session.outcome === "abandoned").length,
    solvedRate: decided.length > 0 ? wonSessions.length / decided.length : null,
    playedDays,
    totalActiveMs,
    avgActiveMsPerSession: decided.length > 0 ? Math.round(totalActiveMs / decided.length) : null,
    avgAttempts: average(attemptsOfDecided),
    medianAttempts: median(attemptsOfDecided),
    avgHints: average(hintsOfDecided),
    favoriteGameId: perGame[0]?.gameId ?? null,
    perGame,
    gamesByWordLength: byWordLength,
    favoriteWordLength: favoriteKey(byWordLength),
  };
}

export function computePersonalRecords(sessions: readonly GameSessionRow[]): PersonalRecords {
  const wonSessions = sessions.filter((session) => session.outcome === "won");
  const timedWins = wonSessions.filter((session) => session.activeDurationMs > 0);

  const gamesPerDay = new Map<string, number>();
  const winsPerDay = new Map<string, number>();
  for (const session of sessions) {
    gamesPerDay.set(session.playDate, (gamesPerDay.get(session.playDate) ?? 0) + 1);
  }
  for (const session of wonSessions) {
    winsPerDay.set(session.playDate, (winsPerDay.get(session.playDate) ?? 0) + 1);
  }

  return {
    fastestWinMs: timedWins.length > 0 ? Math.min(...timedWins.map((session) => session.activeDurationMs)) : null,
    fewestAttemptsWin: wonSessions.length > 0 ? Math.min(...wonSessions.map((session) => session.attemptCount)) : null,
    mostGamesInADay: maxOrNull(gamesPerDay.values()),
    mostWinsInADay: maxOrNull(winsPerDay.values()),
  };
}

function average(values: readonly number[]): number | null {
  if (values.length === 0) return null;

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function maxOrNull(values: Iterable<number>): number | null {
  let max: number | null = null;
  for (const value of values) {
    max = max === null ? value : Math.max(max, value);
  }

  return max;
}

function favoriteKey(byValue: Record<number, number>): number | null {
  let favorite: number | null = null;
  let bestCount = 0;

  for (const [key, count] of Object.entries(byValue)) {
    const length = Number(key);
    if (count > bestCount || (count === bestCount && favorite !== null && length < favorite)) {
      favorite = length;
      bestCount = count;
    }
  }

  return favorite;
}
