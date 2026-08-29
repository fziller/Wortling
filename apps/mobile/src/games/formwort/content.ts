import { generatedTargetWords as fiveLetterTargets } from "../between/generated/targetWords";
import { generatedTargetWords as sixLetterTargets } from "../wortcode/generated/targetWords";
import { generatedTargetWords as sevenLetterTargets } from "../shared/generated/targetWords7";
import { worttrefferGuessWordsByLength } from "../worttreffer/content";
import type { WordsByLength } from "../wordLengths";

export const FORMWORT_CONTENT_VERSION = 5;

export const formwortTargetsByLength: WordsByLength = {
  5: [...(fiveLetterTargets as unknown as string[])],
  6: [...(sixLetterTargets as unknown as string[])],
  7: [...(sevenLetterTargets as unknown as string[])],
};

export const formwortGuessWordsByLength: WordsByLength = {
  5: Array.from(new Set([...(formwortTargetsByLength[5] ?? []), ...(worttrefferGuessWordsByLength[5] ?? [])])).sort(),
  6: Array.from(new Set([...(formwortTargetsByLength[6] ?? []), ...(worttrefferGuessWordsByLength[6] ?? [])])).sort(),
  7: Array.from(new Set([...(formwortTargetsByLength[7] ?? []), ...(worttrefferGuessWordsByLength[7] ?? [])])).sort(),
};

export const formwortAnswers = Object.values(formwortTargetsByLength).flat();
export const formwortGuessWords = Object.values(formwortGuessWordsByLength).flat();
