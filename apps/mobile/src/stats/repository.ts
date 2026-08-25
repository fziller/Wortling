import { initStats } from "./db";
import { normalizeWord } from "./normalize";
import {
  STATS_SCHEMA_VERSION,
  type GameOutcome,
  type GameSessionRow,
  type GuessInput,
  type SessionCountersPatch,
  type SessionStartInput,
  type StatsEventInput,
  type ValidGuessRow,
} from "./types";

// ponytail: full-table reads for stats; add a statistics_cache when session
// volume makes recomputation measurably slow (spec section 9).

export async function findOpenSession(gameId: string, playDate: string, puzzleId: string): Promise<GameSessionRow | null> {
  const db = await initStats();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    "SELECT * FROM game_sessions WHERE game_id = ? AND play_date = ? AND puzzle_id = ? AND outcome IS NULL ORDER BY started_at DESC LIMIT 1",
    [gameId, playDate, puzzleId],
  );

  return row ? mapSessionRow(row) : null;
}

export async function createSession(input: SessionStartInput): Promise<GameSessionRow> {
  const db = await initStats();
  const now = new Date().toISOString();
  const row: GameSessionRow = {
    id: randomId(),
    gameId: input.gameId,
    gameVersion: input.gameVersion ?? 0,
    playDate: input.playDate,
    puzzleId: input.puzzleId ?? null,
    startedAt: now,
    completedAt: null,
    outcome: null,
    wordLength: input.wordLength ?? null,
    difficulty: input.difficulty ?? null,
    attemptCount: 0,
    hintCount: 0,
    invalidGuessCount: 0,
    duplicateGuessCount: 0,
    activeDurationMs: 0,
    createdAt: now,
    updatedAt: now,
    schemaVersion: STATS_SCHEMA_VERSION,
  };

  await db.runAsync(
    `INSERT INTO game_sessions (
      id, game_id, game_version, play_date, puzzle_id, started_at, completed_at, outcome,
      word_length, difficulty, attempt_count, hint_count, invalid_guess_count, duplicate_guess_count,
      active_duration_ms, game_data, created_at, updated_at, schema_version
    ) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, 0, 0, 0, 0, 0, NULL, ?, ?, ?)`,
    [
      row.id,
      row.gameId,
      row.gameVersion,
      row.playDate,
      row.puzzleId,
      row.startedAt,
      row.wordLength,
      row.difficulty,
      row.createdAt,
      row.updatedAt,
      row.schemaVersion,
    ],
  );

  return row;
}

export async function updateSessionProgress(id: string, patch: SessionCountersPatch): Promise<void> {
  const db = await initStats();
  const assignments: string[] = ["updated_at = ?"];
  const values: (string | number)[] = [new Date().toISOString()];

  const columns: Array<[keyof SessionCountersPatch, string]> = [
    ["attemptCount", "attempt_count"],
    ["hintCount", "hint_count"],
    ["invalidGuessCount", "invalid_guess_count"],
    ["duplicateGuessCount", "duplicate_guess_count"],
    ["activeDurationMs", "active_duration_ms"],
  ];

  for (const [key, column] of columns) {
    const value = patch[key];
    if (value === undefined) continue;
    assignments.push(`${column} = ?`);
    values.push(value);
  }

  values.push(id);
  await db.runAsync(`UPDATE game_sessions SET ${assignments.join(", ")} WHERE id = ?`, values);
}

export async function finishSession(
  id: string,
  outcome: GameOutcome,
  counters: Required<SessionCountersPatch>,
): Promise<void> {
  const db = await initStats();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE game_sessions
     SET outcome = ?, completed_at = ?, attempt_count = ?, hint_count = ?,
         invalid_guess_count = ?, duplicate_guess_count = ?, active_duration_ms = ?, updated_at = ?
     WHERE id = ?`,
    [
      outcome,
      now,
      counters.attemptCount,
      counters.hintCount,
      counters.invalidGuessCount,
      counters.duplicateGuessCount,
      counters.activeDurationMs,
      now,
      id,
    ],
  );
}

export async function closeAbandonedSessions(beforePlayDate: string): Promise<number> {
  const db = await initStats();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    "UPDATE game_sessions SET outcome = 'abandoned', completed_at = ?, updated_at = ? WHERE outcome IS NULL AND play_date < ?",
    [now, now, beforePlayDate],
  );

  return result.changes;
}

export async function addGuess(sessionId: string, guess: GuessInput): Promise<void> {
  const db = await initStats();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO guesses (
      id, session_id, sequence, word, normalized_word, word_length,
      submitted_at, elapsed_ms, valid, duplicate, game_data, created_at, updated_at, schema_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      randomId(),
      sessionId,
      guess.sequence,
      guess.word ?? null,
      guess.word ? normalizeWord(guess.word) : null,
      guess.word !== undefined ? [...guess.word].length : null,
      now,
      guess.elapsedMs ?? null,
      guess.valid ? 1 : 0,
      guess.duplicate ? 1 : 0,
      guess.gameData ? JSON.stringify(guess.gameData) : null,
      now,
      now,
      STATS_SCHEMA_VERSION,
    ],
  );
}

export async function addEvent(event: StatsEventInput): Promise<void> {
  const db = await initStats();

  await db.runAsync(
    "INSERT INTO game_events (id, session_id, type, timestamp, metadata, created_at, schema_version) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      randomId(),
      event.sessionId,
      event.type,
      event.timestamp,
      event.metadata ? JSON.stringify(event.metadata) : null,
      new Date().toISOString(),
      STATS_SCHEMA_VERSION,
    ],
  );
}

export async function getAllSessions(): Promise<GameSessionRow[]> {
  const db = await initStats();
  const rows = await db.getAllAsync<Record<string, unknown>>("SELECT * FROM game_sessions ORDER BY play_date, started_at");

  return rows.map(mapSessionRow);
}

export async function getRecentSessions(limit = 5): Promise<GameSessionRow[]> {
  const db = await initStats();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    "SELECT * FROM game_sessions ORDER BY COALESCE(completed_at, updated_at) DESC LIMIT ?",
    [limit],
  );

  return rows.map(mapSessionRow);
}

export async function getValidWordGuesses(): Promise<ValidGuessRow[]> {
  const db = await initStats();
  const rows = await db.getAllAsync<{ normalizedWord: string; wordLength: number }>(
    "SELECT normalized_word AS normalizedWord, word_length AS wordLength FROM guesses WHERE valid = 1 AND duplicate = 0 AND length(normalized_word) > 1",
  );

  return rows;
}

function mapSessionRow(row: Record<string, unknown>): GameSessionRow {
  return {
    id: String(row.id),
    gameId: String(row.game_id),
    gameVersion: Number(row.game_version ?? 0),
    playDate: String(row.play_date),
    puzzleId: row.puzzle_id == null ? null : String(row.puzzle_id),
    startedAt: String(row.started_at),
    completedAt: row.completed_at == null ? null : String(row.completed_at),
    outcome: row.outcome == null ? null : (String(row.outcome) as GameOutcome),
    wordLength: row.word_length == null ? null : Number(row.word_length),
    difficulty: row.difficulty == null ? null : String(row.difficulty),
    attemptCount: Number(row.attempt_count ?? 0),
    hintCount: Number(row.hint_count ?? 0),
    invalidGuessCount: Number(row.invalid_guess_count ?? 0),
    duplicateGuessCount: Number(row.duplicate_guess_count ?? 0),
    activeDurationMs: Number(row.active_duration_ms ?? 0),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    schemaVersion: Number(row.schema_version ?? 0),
  };
}

function randomId(): string {
  const cryptoRef = globalThis.crypto as Crypto | undefined;
  if (typeof cryptoRef?.randomUUID === "function") return cryptoRef.randomUUID();

  // ponytail: fallback for runtimes without crypto.randomUUID; stats ids need uniqueness, not cryptographic strength.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const roll = Math.floor(Math.random() * 16);
    const value = char === "x" ? roll : (roll & 0x3) | 0x8;

    return value.toString(16);
  });
}
