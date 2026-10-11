import type { GameSessionRow } from "../types";

export type AnagrammStats = {
  rounds: number;
  solvedRate: number | null;
  averageActiveMs: number | null;
  averageWrongAttempts: number | null;
  averageHints: number | null;
  longestSolvedWordLength: number | null;
};

export function computeAnagrammStats(sessions: readonly GameSessionRow[]): AnagrammStats {
  const anagrammSessions = sessions.filter((session) => session.gameId === "anagramm");
  const decided = anagrammSessions.filter((session) => session.outcome === "won" || session.outcome === "lost" || session.outcome === "revealed");
  const won = decided.filter((session) => session.outcome === "won");

  return {
    rounds: anagrammSessions.length,
    solvedRate: decided.length ? won.length / decided.length : null,
    averageActiveMs: average(decided.map((session) => session.activeDurationMs)),
    averageWrongAttempts: average(decided.map((session) => session.outcome === "won" ? Math.max(0, session.attemptCount - 1) : session.attemptCount)),
    averageHints: average(decided.map((session) => session.hintCount)),
    longestSolvedWordLength: maxOrNull(won.map((session) => session.wordLength).filter((length): length is number => length !== null)),
  };
}

function average(values: readonly number[]): number | null {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function maxOrNull(values: readonly number[]): number | null {
  return values.length ? Math.max(...values) : null;
}
