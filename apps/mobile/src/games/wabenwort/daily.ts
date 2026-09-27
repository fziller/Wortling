import { getBerlinDateKey } from "@/daily/date";
import { pickSeededIndex } from "@/daily/seed";

import { WABENWORT_CONTENT_VERSION, wabenwortPuzzles } from "./content";
import { createWabenwortState } from "./engine";
import type { WabenwortPuzzle } from "./types";

function createPuzzle(item: (typeof wabenwortPuzzles)[number], id: string): WabenwortPuzzle {
  return { ...item, id, version: WABENWORT_CONTENT_VERSION, letters: [...item.letters], words: [...item.words], allowedWords: [...item.allowedWords] };
}

export function createDailyWabenwortGame(date = new Date()) {
  const dateKey = getBerlinDateKey(date);
  const item = wabenwortPuzzles[pickSeededIndex(`${dateKey}:wabenwort:${WABENWORT_CONTENT_VERSION}`, wabenwortPuzzles.length)];
  if (!item) throw new Error("No Wabenwort puzzles available.");
  const puzzle = createPuzzle(item, item.id);
  return { dateKey, puzzle, state: createWabenwortState(puzzle) };
}

export function createNextWabenwortGame(previousPuzzleId?: string, dateKey = "Freies Spiel") {
  const options = wabenwortPuzzles.filter((item) => item.id !== previousPuzzleId);
  const item = options[Math.floor(Math.random() * options.length)] ?? wabenwortPuzzles[0];
  if (!item) throw new Error("No Wabenwort puzzles available.");
  const puzzle = createPuzzle(item, `wabenwort-next-${Date.now()}`);
  return { dateKey, puzzle, state: createWabenwortState(puzzle) };
}

export function restoreWabenwortPuzzle(value: unknown): WabenwortPuzzle | null {
  const puzzle = value as Partial<WabenwortPuzzle> | null;
  if (!puzzle || !Array.isArray(puzzle.letters) || puzzle.letters.length !== 7 || typeof puzzle.centerLetter !== "string" || !Array.isArray(puzzle.words) || !Array.isArray(puzzle.allowedWords)) return null;
  if (typeof puzzle.bronzeWords !== "number" || typeof puzzle.silverWords !== "number" || typeof puzzle.goldWords !== "number") return null;
  return { ...puzzle, id: typeof puzzle.id === "string" ? puzzle.id : `wabenwort-restored-${Date.now()}`, version: typeof puzzle.version === "number" ? puzzle.version : WABENWORT_CONTENT_VERSION } as WabenwortPuzzle;
}
