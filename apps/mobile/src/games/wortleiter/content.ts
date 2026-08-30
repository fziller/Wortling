import { generatedAllowedGuesses } from "./generated/allowedGuesses";
import { generatedWortleiterPuzzles } from "./generated/puzzles";
import type { WortleiterPuzzle } from "./types";
import { getAllAllowedGuesses } from "../packs/allowed";

export const WORTLEITER_CONTENT_VERSION = 4;
export const WORTLEITER_WORD_LENGTH = 4;

// allowedGuesses always includes all packs (bio etc) even when pack is disabled — only targets are gated.
export const allowedGuesses: string[] = [...getAllAllowedGuesses(4)];
export const wortleiterPuzzles: WortleiterPuzzle[] = [...(generatedWortleiterPuzzles as unknown as WortleiterPuzzle[])];
