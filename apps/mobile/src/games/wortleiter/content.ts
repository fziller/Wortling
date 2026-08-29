import { generatedAllowedGuesses } from "./generated/allowedGuesses";
import { generatedWortleiterPuzzles } from "./generated/puzzles";
import type { WortleiterPuzzle } from "./types";

export const WORTLEITER_CONTENT_VERSION = 4;
export const WORTLEITER_WORD_LENGTH = 4;

export const allowedGuesses: string[] = [...(generatedAllowedGuesses as unknown as string[])];
export const wortleiterPuzzles: WortleiterPuzzle[] = [...(generatedWortleiterPuzzles as unknown as WortleiterPuzzle[])];
