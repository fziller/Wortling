import type { GameStatus } from "@/games/types";

export type WabenwortWord = { word: string; score: number; isPangram: boolean };

export type WabenwortPuzzle = {
  id: string;
  version: number;
  letters: string[];
  centerLetter: string;
  words: WabenwortWord[];
  allowedWords: string[];
  bronzeWords: number;
  silverWords: number;
  goldWords: number;
  bronzeScore: number;
  silverScore: number;
  goldScore: number;
  totalScore: number;
};

export type WabenwortRank = "start" | "bronze" | "silber" | "gold";

export type WabenwortState = {
  puzzleId: string;
  foundWords: string[];
  status: GameStatus;
  startedAt?: string;
  completedAt?: string;
};

export type WabenwortSubmitResult =
  | { ok: true; state: WabenwortState; word: WabenwortWord; rank: WabenwortRank }
  | { ok: false; state: WabenwortState; reason: string };
