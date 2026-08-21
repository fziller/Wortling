import { getBerlinDateKey } from "@/daily/date";
import { pickSeededIndex } from "@/daily/seed";

import { WORTLEITER_CONTENT_VERSION, wortleiterPuzzles } from "./content";
import { createWortleiterState } from "./engine";

export function createDailyWortleiterGame(date = new Date()) {
  const dateKey = getBerlinDateKey(date);
  const seed = `${dateKey}:wortleiter:${WORTLEITER_CONTENT_VERSION}`;
  const puzzle = wortleiterPuzzles[pickSeededIndex(seed, wortleiterPuzzles.length)];

  return { dateKey, puzzle, state: createWortleiterState(puzzle) };
}

export function createPracticeWortleiterGame(previousPuzzleId?: string) {
  const options = wortleiterPuzzles.filter((puzzle) => puzzle.id !== previousPuzzleId);
  const puzzle = options[Math.floor(Math.random() * options.length)] ?? wortleiterPuzzles[0];

  return { dateKey: "Freies Spiel", puzzle, state: createWortleiterState(puzzle) };
}
