import AsyncStorage from "@react-native-async-storage/async-storage";

import type { GameStatus } from "@/games/types";

export type StoredProgress<TState = unknown> = {
  gameId: string;
  dateKey: string;
  puzzleId: string;
  puzzleVersion: number;
  status: GameStatus;
  state: TState;
  startedAt?: string;
  completedAt?: string;
};

function progressKey(gameId: string, dateKey: string): string {
  return `wortkniff:progress:${gameId}:${dateKey}`;
}

export async function loadProgress<TState = unknown>(gameId: string, dateKey: string): Promise<StoredProgress<TState> | null> {
  try {
    const raw = await AsyncStorage.getItem(progressKey(gameId, dateKey));

    return raw ? JSON.parse(raw) as StoredProgress<TState> : null;
  } catch {
    return null;
  }
}

export async function saveProgress<TState>(progress: StoredProgress<TState>): Promise<void> {
  try {
    await AsyncStorage.setItem(progressKey(progress.gameId, progress.dateKey), JSON.stringify(progress));
  } catch {
    // Local progress is nice-to-have; gameplay should not crash if storage is unavailable in a dev client.
  }
}

export async function loadProgressForGames(gameIds: readonly string[], dateKey: string): Promise<Record<string, StoredProgress | null>> {
  const entries = await Promise.all(gameIds.map(async (gameId) => [gameId, await loadProgress(gameId, dateKey)] as const));

  return Object.fromEntries(entries);
}
