import { getBerlinDateKey } from "@/daily/date";
import type { BucketPreset } from "@/games/wordBuckets";
import { createWorttrefferState } from "@/games/worttreffer/engine";

import { WORTSCHMELZE_CONTENT_VERSION, wortschmelzePuzzlesByPreset } from "./content";
import type { WortschmelzePuzzle } from "./types";

type GeneratedPuzzle = (typeof wortschmelzePuzzlesByPreset)[BucketPreset][number];

export function createDailyWortschmelzeGame(date = new Date(), preset: BucketPreset = "klassisch") {
  return createNextWortschmelzeGame(undefined, getBerlinDateKey(date), preset);
}

export function createNextWortschmelzeGame(previousAnswer?: string, dateKey = "Freies Spiel", preset: BucketPreset = "klassisch") {
  const source = wortschmelzePuzzlesByPreset[preset] ?? wortschmelzePuzzlesByPreset.klassisch;
  const options = source.filter((puzzle) => puzzle.answer !== previousAnswer);
  const item = (options.length > 0 ? options : source)[Math.floor(Math.random() * (options.length > 0 ? options.length : source.length))];

  if (!item) throw new Error("No Wortschmelze puzzles available.");

  const puzzle = createWortschmelzePuzzle(item, `wortschmelze-next-${Date.now()}`);
  return { dateKey, puzzle, state: createWorttrefferState(puzzle) };
}

export function createWortschmelzePuzzle(item: GeneratedPuzzle, id: string): WortschmelzePuzzle {
  return {
    id,
    version: WORTSCHMELZE_CONTENT_VERSION,
    answer: item.answer,
    left: item.left,
    right: item.right,
    overlap: item.overlap,
    wordLength: 8,
    maxAttempts: 6,
  };
}

export function restoreWortschmelzePuzzle(value: unknown): WortschmelzePuzzle | null {
  const item = value as Partial<WortschmelzePuzzle> | null | undefined;
  if (!item || typeof item.answer !== "string" || typeof item.left !== "string" || typeof item.right !== "string" || typeof item.overlap !== "string") return null;
  if (Array.from(item.answer).length !== 8 || Array.from(item.left).length !== 5 || Array.from(item.right).length !== 5) return null;
  if (!item.left.endsWith(item.overlap) || !item.right.startsWith(item.overlap)) return null;

  return {
    id: typeof item.id === "string" ? item.id : `wortschmelze-restored-${Date.now()}`,
    version: typeof item.version === "number" ? item.version : WORTSCHMELZE_CONTENT_VERSION,
    answer: item.answer,
    left: item.left,
    right: item.right,
    overlap: item.overlap,
    wordLength: 8,
    maxAttempts: typeof item.maxAttempts === "number" && item.maxAttempts > 0 ? item.maxAttempts : 6,
  };
}
