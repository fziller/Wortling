import * as SQLite from "expo-sqlite";

import { STATS_DB_NAME, STATS_SCHEMA_VERSION } from "./types";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const MIGRATIONS: Record<number, string> = {
  1: `
    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      game_id TEXT NOT NULL,
      game_version INTEGER NOT NULL DEFAULT 0,
      play_date TEXT NOT NULL,
      puzzle_id TEXT,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      outcome TEXT,
      word_length INTEGER,
      difficulty TEXT,
      attempt_count INTEGER NOT NULL DEFAULT 0,
      hint_count INTEGER NOT NULL DEFAULT 0,
      invalid_guess_count INTEGER NOT NULL DEFAULT 0,
      duplicate_guess_count INTEGER NOT NULL DEFAULT 0,
      active_duration_ms INTEGER NOT NULL DEFAULT 0,
      game_data TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      schema_version INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_game_sessions_play_date ON game_sessions (play_date);
    CREATE INDEX IF NOT EXISTS idx_game_sessions_game_id ON game_sessions (game_id);

    CREATE TABLE IF NOT EXISTS guesses (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL REFERENCES game_sessions (id),
      sequence INTEGER NOT NULL,
      word TEXT,
      normalized_word TEXT,
      word_length INTEGER,
      submitted_at TEXT NOT NULL,
      elapsed_ms INTEGER,
      valid INTEGER NOT NULL,
      duplicate INTEGER NOT NULL DEFAULT 0,
      game_data TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      schema_version INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_guesses_session_id ON guesses (session_id);
    CREATE INDEX IF NOT EXISTS idx_guesses_normalized_word ON guesses (normalized_word);

    CREATE TABLE IF NOT EXISTS game_events (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL REFERENCES game_sessions (id),
      type TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT NOT NULL,
      schema_version INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_game_events_session_id ON game_events (session_id);
  `,
};

export function initStats(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openStatsDb().catch((error) => {
      dbPromise = null;
      throw error;
    });
  }

  return dbPromise;
}

async function openStatsDb(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(STATS_DB_NAME);
  await db.execAsync("PRAGMA foreign_keys = ON");
  await migrateStatsDb(db);

  return db;
}

async function migrateStatsDb(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  let version = row?.user_version ?? 0;

  while (version < STATS_SCHEMA_VERSION) {
    version += 1;
    const migration = MIGRATIONS[version];
    if (migration) await db.execAsync(migration);
    await db.execAsync(`PRAGMA user_version = ${version}`);
  }
}
