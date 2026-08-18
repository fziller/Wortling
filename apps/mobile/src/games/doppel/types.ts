import type { GameStatus } from "@/games/types";

export type DoppelHint =
  | { type: "length"; value: number }
  | { type: "first_letter"; value: string }
  | { type: "letter"; index: number; value: string }
  | { type: "definition"; value: string };

export type DoppelSolution = {
  answer: string;
  leftCompound: string;
  rightCompound: string;
};

export type DoppelPuzzle = {
  id: string;
  version: number;
  leftWord: string;
  rightWord: string;
  solutions: DoppelSolution[];
  difficulty: "easy" | "medium" | "hard";
  hints?: DoppelHint[];
  explanation?: string;
};

export type DoppelState = {
  puzzleId: string;
  guesses: string[];
  unlockedHints: number;
  status: GameStatus;
  solvedAnswer?: string;
};

export type DoppelGuessResult =
  | { ok: true; state: DoppelState; solution: DoppelSolution }
  | { ok: false; state: DoppelState; reason: string };
