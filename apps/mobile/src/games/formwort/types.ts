import type { GameStatus } from "@/games/types";
import type { WorttrefferTileMark } from "@/games/worttreffer/types";

export type FormwortPuzzle = {
  id: string;
  version: number;
  answer: string;
  wordLength: number;
  maxAttempts: number;
  symbols: string[];
};

export type FormwortGuess = {
  value: string;
  marks: WorttrefferTileMark[];
};

export type FormwortState = {
  puzzleId: string;
  guesses: FormwortGuess[];
  status: GameStatus;
};

export type FormwortSubmitResult =
  | { ok: true; state: FormwortState; guess: FormwortGuess }
  | { ok: false; state: FormwortState; reason: string };
