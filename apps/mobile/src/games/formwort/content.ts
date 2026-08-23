import { worttrefferGuessWordsByLength } from "../worttreffer/content";
import type { WordsByLength } from "../wordLengths";

export const FORMWORT_CONTENT_VERSION = 2;

export const formwortTargetsByLength = {
  5: [
    "allee",
    "essen",
    "innen",
    "kette",
    "motto",
    "puppe",
    "seele",
    "tasse",
  ],
  6: [
    "banane",
    "kaffee",
    "mutter",
    "sommer",
    "teller",
    "wasser",
    "winter",
    "zimmer",
  ],
  7: [
    "ballast",
    "brunnen",
    "schloss",
    "semmeln",
    "sonnige",
    "stellen",
    "trommel",
  ],
} as const satisfies WordsByLength;

export const formwortGuessWordsByLength = {
  5: Array.from(new Set([...formwortTargetsByLength[5], ...(worttrefferGuessWordsByLength[5] ?? [])])).sort(),
  6: Array.from(new Set([...formwortTargetsByLength[6], ...(worttrefferGuessWordsByLength[6] ?? [])])).sort(),
  7: Array.from(new Set([...formwortTargetsByLength[7], ...(worttrefferGuessWordsByLength[7] ?? [])])).sort(),
} as const satisfies WordsByLength;

export const formwortAnswers = Object.values(formwortTargetsByLength).flat();
export const formwortGuessWords = Object.values(formwortGuessWordsByLength).flat();
