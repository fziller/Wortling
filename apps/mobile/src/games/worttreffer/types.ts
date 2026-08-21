import type { GameStatus } from "@/games/types";

import type { KeyboardLetterState } from "../../components/WordKeyboard";

export type WorttrefferTileMark = "absent" | "present" | "correct";

export type WorttrefferPuzzle = {
  id: string;
  version: number;
  answer: string;
  wordLength: number;
  maxAttempts: number;
};

export type WorttrefferGuess = {
  value: string;
  marks: WorttrefferTileMark[];
};

export type WorttrefferState = {
  puzzleId: string;
  guesses: WorttrefferGuess[];
  status: GameStatus;
};

export type WorttrefferSubmitResult =
  | { ok: true; state: WorttrefferState; guess: WorttrefferGuess }
  | { ok: false; state: WorttrefferState; reason: string };

export type WorttrefferLetterStates = Record<string, KeyboardLetterState>;
