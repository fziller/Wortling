import { generatedAllowedGuesses as fiveLetterTargets } from "../between/generated/allowedGuesses";
import { generatedAllowedGuesses as sixLetterTargets } from "../wortcode/generated/allowedGuesses";
import { generatedAllowedGuesses as sevenLetterTargets } from "../shared/generated/allowedGuesses7";
import { worttrefferGuessWordsByLength } from "../worttreffer/content";
import type { WordsByLength } from "../wordLengths";

export const FORMWORT_CONTENT_VERSION = 3;

export const formwortTargetsByLength: WordsByLength = {
  5: [...fiveLetterTargets],
  6: [...sixLetterTargets],
  7: [...sevenLetterTargets],
};

export const formwortGuessWordsByLength: WordsByLength = {
  5: Array.from(new Set([...(formwortTargetsByLength[5] ?? []), ...(worttrefferGuessWordsByLength[5] ?? [])])).sort(),
  6: Array.from(new Set([...(formwortTargetsByLength[6] ?? []), ...(worttrefferGuessWordsByLength[6] ?? [])])).sort(),
  7: Array.from(new Set([...(formwortTargetsByLength[7] ?? []), ...(worttrefferGuessWordsByLength[7] ?? [])])).sort(),
};

export const formwortAnswers = Object.values(formwortTargetsByLength).flat();
export const formwortGuessWords = Object.values(formwortGuessWordsByLength).flat();
