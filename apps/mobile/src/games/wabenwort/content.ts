import { generatedWabenwortPuzzles } from "./generated/puzzles";
import type { WabenwortPuzzle } from "./types";

export const WABENWORT_CONTENT_VERSION = 2;
export const wabenwortPuzzles = generatedWabenwortPuzzles as unknown as readonly Omit<WabenwortPuzzle, "version">[];
