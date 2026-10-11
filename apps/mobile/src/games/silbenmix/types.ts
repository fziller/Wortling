import type { GameStatus } from "@/games/types";

export type SilbenmixDifficulty = "easy" | "medium" | "hard";

export type SilbenmixTile = {
  id: string;
  syllable: string;
};

export type SilbenmixTarget = {
  id: string;
  word: string;
  syllables: string[];
};

export type SilbenmixPuzzle = {
  id: string;
  version: number;
  difficulty: SilbenmixDifficulty;
  targets: SilbenmixTarget[];
  tiles: SilbenmixTile[];
  syllableCount: number;
};

export type SilbenmixGeneratedPuzzle = {
  id: string;
  version: number;
  difficulty: SilbenmixDifficulty;
  targetIndexes: number[];
  tileOrder: number[];
  syllableCount: number;
};

export type SilbenmixState = {
  puzzleId: string;
  selectedTileIds: string[];
  usedTileIds: string[];
  solvedTargetIds: string[];
  revealedTargetIds: string[];
  hintedTileIds: string[];
  status: GameStatus;
  startedAt?: string;
  completedAt?: string;
};

export type SilbenmixSubmitResult =
  | { ok: true; word: string; state: SilbenmixState }
  | { ok: false; reason: string; state: SilbenmixState };
