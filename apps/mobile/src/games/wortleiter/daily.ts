import { getBerlinDateKey } from "@/daily/date";

import { wortleiterPuzzles } from "./content";
import { createWortleiterState } from "./engine";
import { pickFreshRound } from "@/storage/recentRounds";

export function createDailyWortleiterGame(date = new Date()) {
  return createNextWortleiterGame(undefined, getBerlinDateKey(date));
}

export function createNextWortleiterGame(previousPuzzleId?: string, dateKey = "Freies Spiel") {
  const options = wortleiterPuzzles.filter((puzzle) => puzzle.id !== previousPuzzleId);
  const puzzle = pickFreshRound("wortleiter", () => options[Math.floor(Math.random() * options.length)] ?? wortleiterPuzzles[0], (item) => item.id);

  return { dateKey, puzzle, state: createWortleiterState(puzzle) };
}
