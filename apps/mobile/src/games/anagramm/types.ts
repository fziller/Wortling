import type { GameStatus } from "@/games/types";

export type AnagrammWordLength = 4 | 5 | 6 | 7 | 8;
export type AnagrammDifficulty = "easy" | "medium" | "hard";

export type AnagrammPuzzle = {
  id: string;
  version: number;
  answer: string;
  shuffledLetters: string[];
  acceptedAnswers: string[];
  wordLength: AnagrammWordLength;
  difficulty: AnagrammDifficulty;
  maxAttempts: number;
};

export type AnagrammState = {
  puzzleId: string;
  guesses: string[];
  placedTileIndices: (number | null)[];
  fixedIndices: number[];
  status: GameStatus;
};

export type AnagrammSubmitResult =
  | { ok: true; guess: string; state: AnagrammState }
  | { ok: false; reason: string; state: AnagrammState };
