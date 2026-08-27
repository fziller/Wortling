import { getBerlinDateKey } from "@/daily/date";
import { pickSeededIndex } from "@/daily/seed";

import { GALGENWORT_CONTENT_VERSION, galgenwortPuzzles } from "./content";
import { createGalgenwortState } from "./engine";
import { BucketPreset } from "@/games/wordBuckets";
import { getGalgenwortPuzzlesForPreset } from "./content";

export function createDailyGalgenwortGame(date = new Date(), preset: BucketPreset = "klassisch") {
  const dateKey = getBerlinDateKey(date);
  const seed = `${dateKey}:galgenwort:${GALGENWORT_CONTENT_VERSION}:${preset}`;
  const pool = getGalgenwortPuzzlesForPreset(preset);
  const puzzle = pool[pickSeededIndex(seed, pool.length)];

  return { dateKey, puzzle, state: createGalgenwortState(puzzle) };
}

export function createNextGalgenwortGame(previousPuzzleId?: string, dateKey = "Freies Spiel", preset: BucketPreset = "klassisch") {
  const pool = getGalgenwortPuzzlesForPreset(preset);
  const options = pool.filter((puzzle) => puzzle.id !== previousPuzzleId);
  const puzzle = options[Math.floor(Math.random() * options.length)] ?? pool[0];

  return { dateKey, puzzle, state: createGalgenwortState(puzzle) };
}
