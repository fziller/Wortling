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

export function createPracticeDoppelGame(previousPuzzleId?: string) {
  const options = doppelPuzzles.filter((puzzle) => puzzle.id !== previousPuzzleId);
  const puzzle = options[Math.floor(Math.random() * options.length)] ?? doppelPuzzles[0];

  return { dateKey: "Freies Spiel", puzzle, state: createDoppelState(puzzle) };
}
