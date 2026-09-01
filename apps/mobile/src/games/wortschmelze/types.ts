import type { WorttrefferGuess, WorttrefferPuzzle, WorttrefferState } from "@/games/worttreffer/types";

export type WortschmelzePuzzle = WorttrefferPuzzle & {
  left: string;
  right: string;
  overlap: string;
};

export type WortschmelzeGuess = WorttrefferGuess;
export type WortschmelzeState = WorttrefferState;
