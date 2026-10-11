import type { GameGuessDataRow } from "../repository";
import type { GameSessionRow } from "../types";

export type SilbenmixStats = { rounds: number; solvedRate: number | null; totalSelfFoundWords: number; averageActiveMs: number | null; averageHints: number | null; largestSolvedRound: number | null };

export function computeSilbenmixStats(sessions: readonly GameSessionRow[], guessData: readonly GameGuessDataRow[]): SilbenmixStats {
  const gameSessions = sessions.filter((session) => session.gameId === "silbenmix");
  const decided = gameSessions.filter((session) => session.outcome === "won" || session.outcome === "revealed");
  const targetsBySession = new Map<string, number>();
  for (const item of guessData) if (typeof item.gameData.targetWords === "number") targetsBySession.set(item.sessionId, item.gameData.targetWords);
  const won = decided.filter((session) => session.outcome === "won");
  return { rounds: gameSessions.length, solvedRate: decided.length ? won.length / decided.length : null, totalSelfFoundWords: gameSessions.reduce((sum, session) => sum + session.attemptCount, 0), averageActiveMs: average(decided.map((session) => session.activeDurationMs)), averageHints: average(decided.map((session) => session.hintCount)), largestSolvedRound: maxOrNull(won.map((session) => targetsBySession.get(session.id)).filter((value): value is number => value !== undefined)) };
}

function average(values: readonly number[]): number | null { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null; }
function maxOrNull(values: readonly number[]): number | null { return values.length ? Math.max(...values) : null; }
