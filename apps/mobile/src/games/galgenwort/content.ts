import { generatedTargetWords as fiveLetterTargets } from "../between/generated/targetWords";
import { generatedTargetWords as sixLetterTargets } from "../wortcode/generated/targetWords";
import { generatedTargetWords as sevenLetterTargets } from "../shared/generated/targetWords7";
import { generatedTargetWords as fourLetterTargets } from "../wortleiter/generated/targetWords";
import { generatedErweitertWords as fiveLetterErweitert } from "../between/generated/erweitertWords";
import { generatedErweitertWords as sixLetterErweitert } from "../wortcode/generated/erweitertWords";
import { generatedErweitertWords as sevenLetterErweitert } from "../shared/generated/erweitertWords7";
import { generatedErweitertWords as fourLetterErweitert } from "../wortleiter/generated/erweitertWords";
import { generatedHartWords as fiveLetterHart } from "../between/generated/hartWords";
import { generatedHartWords as sixLetterHart } from "../wortcode/generated/hartWords";
import { generatedHartWords as sevenLetterHart } from "../shared/generated/hartWords7";
import { generatedHartWords as fourLetterHart } from "../wortleiter/generated/hartWords";

import type { GalgenwortPuzzle } from "./types";
import type { BucketPreset } from "@/games/wordBuckets";

export const GALGENWORT_CONTENT_VERSION = 5;
export const GALGENWORT_MAX_WRONG_GUESSES = 8;

function buildPool(words: readonly string[]): string[] {
  return Array.from(new Set(words)).filter((w) => /^[a-zäöü]{4,10}$/u.test(w) && !/[qx]/u.test(w));
}

const classicPool = buildPool([
  ...(fourLetterTargets as unknown as string[]),
  ...(fiveLetterTargets as unknown as string[]),
  ...(sixLetterTargets as unknown as string[]),
  ...(sevenLetterTargets as unknown as string[]),
]);

const erweitertPool = buildPool([
  ...(fourLetterErweitert as unknown as string[]),
  ...(fiveLetterErweitert as unknown as string[]),
  ...(sixLetterErweitert as unknown as string[]),
  ...(sevenLetterErweitert as unknown as string[]),
]);

const hartPool = buildPool([
  ...(fourLetterHart as unknown as string[]),
  ...(fiveLetterHart as unknown as string[]),
  ...(sixLetterHart as unknown as string[]),
  ...(sevenLetterHart as unknown as string[]),
]);

// Default pool is classic (klassisch)
const galgenwortWordPool: string[] = classicPool;

export const galgenwortPuzzles: GalgenwortPuzzle[] = galgenwortWordPool.map((answer, index) =>
  puzzle(`galgenwort-${String(index + 1).padStart(4, "0")}`, answer, ""),
);

export function getGalgenwortPuzzlesForPreset(preset: BucketPreset): GalgenwortPuzzle[] {
  if (preset === "hart") return hartPool.map((answer, index) => puzzle(`galgenwort-${String(index + 1).padStart(4, "0")}`, answer, ""));
  if (preset === "erweitert") return erweitertPool.map((answer, index) => puzzle(`galgenwort-${String(index + 1).padStart(4, "0")}`, answer, ""));
  return galgenwortPuzzles;
}

function puzzle(id: string, answer: string, clue: string): GalgenwortPuzzle {
  return { id, version: GALGENWORT_CONTENT_VERSION, answer, clue, maxWrongGuesses: GALGENWORT_MAX_WRONG_GUESSES };
}
