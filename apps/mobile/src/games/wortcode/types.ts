import type { GameStatus } from "@/games/types";

export type WortcodeLetterMark = "none" | "included" | "exact";

export type WortcodePuzzle = {
  id: string;
  version: number;
  answer: string;
  wordLength: number;
  maxAttempts: number;
  difficulty: "easy" | "medium" | "hard";
};

export type WortcodeGuess = {
  value: string;
  exactMatches: number;
  misplacedMatches: number;
  marks?: WortcodeLetterMark[];
};

export type WortcodeState = {
  puzzleId: string;
  guesses: WortcodeGuess[];
  status: GameStatus;
};

export type WortcodeSubmitResult =
  | { ok: true; state: WortcodeState; guess: WortcodeGuess }
  | { ok: false; state: WortcodeState; reason: string };
