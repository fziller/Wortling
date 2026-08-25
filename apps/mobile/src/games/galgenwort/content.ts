import { generatedAllowedGuesses as fiveLetterGuesses } from "../between/generated/allowedGuesses";
import { generatedAllowedGuesses as sixLetterGuesses } from "../wortcode/generated/allowedGuesses";
import { generatedAllowedGuesses as sevenLetterGuesses } from "../shared/generated/allowedGuesses7";
import { generatedAllowedGuesses as fourLetterGuesses } from "../wortleiter/generated/allowedGuesses";

import type { GalgenwortPuzzle } from "./types";

export const GALGENWORT_CONTENT_VERSION = 2;
export const GALGENWORT_MAX_WRONG_GUESSES = 8;

// Pool from all sensible generated word lists (no curated clue needed)
const galgenwortWordPool: string[] = Array.from(
  new Set([...(fourLetterGuesses as unknown as string[]), ...(fiveLetterGuesses as unknown as string[]), ...(sixLetterGuesses as unknown as string[]), ...(sevenLetterGuesses as unknown as string[])]),
).filter((w) => /^[a-zäöüß]{4,10}$/u.test(w) && !/[qx]/u.test(w));

export const galgenwortPuzzles: GalgenwortPuzzle[] = galgenwortWordPool.map((answer, index) =>
  puzzle(`galgenwort-${String(index + 1).padStart(4, "0")}`, answer, ""),
);

function puzzle(id: string, answer: string, clue: string): GalgenwortPuzzle {
  return { id, version: GALGENWORT_CONTENT_VERSION, answer, clue, maxWrongGuesses: GALGENWORT_MAX_WRONG_GUESSES };
}
