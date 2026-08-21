import type { GameStatus } from "@/games/types";

export type GalgenwortPuzzle = {
  id: string;
  version: number;
  answer: string;
  clue: string;
  maxWrongGuesses: number;
};

export type GalgenwortState = {
  puzzleId: string;
  guessedLetters: string[];
  status: GameStatus;
};

export type GalgenwortGuessResult =
  | { ok: true; state: GalgenwortState; correct: boolean }
  | { ok: false; state: GalgenwortState; reason: string };
