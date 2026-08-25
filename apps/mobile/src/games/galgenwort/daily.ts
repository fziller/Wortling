import { getBerlinDateKey } from "@/daily/date";
import { pickSeededIndex } from "@/daily/seed";

import { GALGENWORT_CONTENT_VERSION, galgenwortPuzzles } from "./content";
import { createGalgenwortState } from "./engine";

export function createDailyGalgenwortGame(date = new Date()) {
  const dateKey = getBerlinDateKey(date);
  const seed = `${dateKey}:galgenwort:${GALGENWORT_CONTENT_VERSION}`;
  const puzzle = galgenwortPuzzles[pickSeededIndex(seed, galgenwortPuzzles.length)];

  return { dateKey, puzzle, state: createGalgenwortState(puzzle) };
}

export function createNextGalgenwortGame(previousPuzzleId?: string, dateKey = "Freies Spiel") {
  const options = galgenwortPuzzles.filter((puzzle) => puzzle.id !== previousPuzzleId);
  const puzzle = options[Math.floor(Math.random() * options.length)] ?? galgenwortPuzzles[0];

  return { dateKey, puzzle, state: createGalgenwortState(puzzle) };
}
