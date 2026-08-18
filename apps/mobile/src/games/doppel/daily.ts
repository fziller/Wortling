import { getBerlinDateKey } from "@/daily/date";
import { pickSeededIndex } from "@/daily/seed";

import { DOPPEL_CONTENT_VERSION, doppelPuzzles } from "./content";
import { createDoppelState } from "./engine";

export function createDailyDoppelGame(date = new Date()) {
  const dateKey = getBerlinDateKey(date);
  const seed = `${dateKey}:doppel:${DOPPEL_CONTENT_VERSION}`;
  const puzzle = doppelPuzzles[pickSeededIndex(seed, doppelPuzzles.length)];

  return { dateKey, puzzle, state: createDoppelState(puzzle) };
}
