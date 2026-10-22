import AsyncStorage from "@react-native-async-storage/async-storage";

import type { GameStatus } from "@/games/types";

export type StoredProgress<TState = unknown> = {
  gameId: string;
  dateKey: string;
  draft?: unknown;
  completedStatus?: GameStatus;
  puzzle?: unknown;
  puzzleId: string;
  puzzleVersion: number;
  status: GameStatus;
  state: TState;
  startedAt?: string;
  completedAt?: string;
  /** Official scoring outcome is immutable even while a player keeps solving. */
  officialOutcome?: Extract<GameStatus, "lost">;
  continuedAfterLoss?: boolean;
  solvedAfterLoss?: boolean;
  officialLossAttemptCount?: number;
  postLossCompletion?: "solved" | "revealed";
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

export function mergeCompletedStatus(previous: GameStatus | undefined, next: GameStatus | undefined): GameStatus | undefined {
  if (previous === "won" || next === "won") return "won";
  if (previous === "lost") return "lost";
  return next ?? previous;
}

/** A loss remains official when a player keeps solving after running out of attempts. */
export function resolveOfficialOutcome(
  previous: StoredProgress["officialOutcome"] | undefined,
  status: GameStatus,
  continuedAfterLoss: boolean,
): StoredProgress["officialOutcome"] | undefined {
  if (previous === "lost" || continuedAfterLoss || status === "lost") return "lost";
  return undefined;
}

/** Restores the immutable loss marker from both current and legacy progress records. */
export function getStoredOfficialOutcome(progress: StoredProgress | null | undefined): StoredProgress["officialOutcome"] | undefined {
  // Older builds kept this marker when a player started a new round on the
  // same day. A clean win cannot be a continuation of that earlier loss.
  if (
    progress?.officialOutcome === "lost" &&
    progress.status === "won" &&
    !progress.continuedAfterLoss &&
    !progress.solvedAfterLoss &&
    !progress.postLossCompletion
  ) return undefined;

  if (progress?.officialOutcome === "lost" || progress?.continuedAfterLoss || progress?.solvedAfterLoss || progress?.postLossCompletion) return "lost";
  return undefined;
}

export function isStartedProgress(progress: StoredProgress | null | undefined): progress is StoredProgress {
  if (!progress || progress.status !== "playing") return false;
  if (!progress.puzzle) return false;
  if (hasDraft(progress.draft)) return true;

  const state = progress.state as Record<string, unknown> | null | undefined;
  if (!state) return false;

  if (Array.isArray(state.guesses) && state.guesses.length > 0) return true;
  if (Array.isArray(state.guessedLetters) && state.guessedLetters.length > 0) return true;
  if (Array.isArray(state.words) && state.words.length > 1) return true;
  if (Array.isArray(state.solvedTargetIds) && state.solvedTargetIds.length > 0) return true;
  if (Array.isArray(state.revealedTargetIds) && state.revealedTargetIds.length > 0) return true;
  if (Array.isArray(state.selectedTileIds) && state.selectedTileIds.length > 0) return true;
  if (typeof state.unlockedHints === "number" && state.unlockedHints > 0) return true;
  if (Array.isArray(state.revealedIndices) && state.revealedIndices.length > 0) return true;

  return false;
}

function hasDraft(draft: unknown): boolean {
  if (typeof draft === "string") return draft.length > 0;
  if (Array.isArray(draft)) return draft.some(Boolean);

  return false;
}
