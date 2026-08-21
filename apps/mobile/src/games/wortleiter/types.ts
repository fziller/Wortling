import type { GameStatus } from "@/games/types";

export type WortleiterDifficulty = "easy" | "medium" | "hard";

export type WortleiterPuzzle = {
  id: string;
  version: number;
  startWord: string;
  targetWord: string;
  wordLength: number;
  optimalSteps: number;
  difficulty: WortleiterDifficulty;
  solution: string[];
};

export type WortleiterState = {
  puzzleId: string;
  words: string[];
  status: GameStatus;
  startedAt?: string;
  completedAt?: string;
};

export type WortleiterSubmitResult =
  | { ok: true; state: WortleiterState; word: string }
  | { ok: false; state: WortleiterState; reason: string };
