import { generatedAllowedGuesses as fiveLetterGuesses } from "@/games/between/generated/allowedGuesses";

import { generatedWortschmelzePuzzles } from "./generated/puzzles";

export const WORTSCHMELZE_CONTENT_VERSION = 1;
export const wortschmelzePuzzlesByPreset = generatedWortschmelzePuzzles;
const fiveLetterGuessSet = new Set(fiveLetterGuesses as unknown as string[]);

export function isAllowedWortschmelzeGuess(value: string): boolean {
  const letters = Array.from(value);
  if (letters.length !== 8) return false;

  return fiveLetterGuessSet.has(letters.slice(0, 5).join("")) && fiveLetterGuessSet.has(letters.slice(3, 8).join(""));
}
