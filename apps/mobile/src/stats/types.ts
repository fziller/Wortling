export type GameOutcome = "won" | "lost" | "revealed" | "abandoned";

export const STATS_SCHEMA_VERSION = 1;
export const STATS_DB_NAME = "wortkniff-stats.db";

export type GameSessionRow = {
  id: string;
  gameId: string;
  gameVersion: number;
  playDate: string;
  puzzleId: string | null;
  startedAt: string;
  completedAt: string | null;
  outcome: GameOutcome | null;
  wordLength: number | null;
  difficulty: string | null;
  attemptCount: number;
  hintCount: number;
  invalidGuessCount: number;
  duplicateGuessCount: number;
  activeDurationMs: number;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
};

export type SessionStartInput = {
  gameId: string;
  playDate: string;
  puzzleId?: string;
  gameVersion?: number;
  wordLength?: number;
  difficulty?: string;
};

export type SessionCountersPatch = {
  attemptCount?: number;
  hintCount?: number;
  invalidGuessCount?: number;
  duplicateGuessCount?: number;
  activeDurationMs?: number;
};

export type GuessInput = {
  sequence: number;
  word?: string;
  valid: boolean;
  duplicate: boolean;
  elapsedMs?: number;
  gameData?: Record<string, unknown>;
};

export type ValidGuessRow = {
  normalizedWord: string;
  wordLength: number;
};

export type StatsEventType = "hint_used";

export type StatsEventInput = {
  sessionId: string;
  type: StatsEventType;
  timestamp: string;
  metadata?: Record<string, unknown>;
};
