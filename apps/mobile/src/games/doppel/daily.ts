import { getBerlinDateKey } from "@/daily/date";

import { doppelPuzzles } from "./content";
import { createDoppelState } from "./engine";
import { pickFreshRound } from "@/storage/recentRounds";

export function createDailyDoppelGame(date = new Date()) {
  return createNextDoppelGame(undefined, getBerlinDateKey(date));
}

export function createNextDoppelGame(previousPuzzleId?: string, dateKey = "Freies Spiel") {
  const options = doppelPuzzles.filter((puzzle) => puzzle.id !== previousPuzzleId);
  const puzzle = pickFreshRound("doppel", () => options[Math.floor(Math.random() * options.length)] ?? doppelPuzzles[0], (item) => item.id);

  return { dateKey, puzzle, state: createDoppelState(puzzle) };
}
