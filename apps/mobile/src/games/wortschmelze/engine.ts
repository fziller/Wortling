import { submitWorttrefferGuess } from "@/games/worttreffer/engine";

import { isAllowedWortschmelzeGuess } from "./content";
import type { WortschmelzePuzzle, WortschmelzeState } from "./types";

export function submitWortschmelzeGuess(puzzle: WortschmelzePuzzle, state: WortschmelzeState, rawGuess: string) {
  return submitWorttrefferGuess(puzzle, state, rawGuess, { has: isAllowedWortschmelzeGuess });
}
