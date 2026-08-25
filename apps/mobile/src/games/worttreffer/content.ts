import { allowedGuesses as fiveLetterGuesses } from "../between/content";
import { generatedAllowedGuesses as sevenLetterGuesses } from "../shared/generated/allowedGuesses7";
import { generatedAllowedGuesses as sixLetterGuesses } from "../wortcode/generated/allowedGuesses";
import { generatedAllowedGuesses as fourLetterGuesses } from "../wortleiter/generated/allowedGuesses";
import type { WordsByLength } from "../wordLengths";

export const WORTTREFFER_CONTENT_VERSION = 4;

export const worttrefferTargetsByLength: WordsByLength = {
  4: [...fourLetterGuesses],
  5: [...fiveLetterGuesses],
  6: [...sixLetterGuesses],
  7: [...sevenLetterGuesses],
};

export const worttrefferGuessWordsByLength: WordsByLength = {
  4: Array.from(new Set([...(worttrefferTargetsByLength[4] ?? []), ...fourLetterGuesses])).sort(),
  5: Array.from(new Set([...(worttrefferTargetsByLength[5] ?? []), ...fiveLetterGuesses])).sort(),
  6: Array.from(new Set([...(worttrefferTargetsByLength[6] ?? []), ...sixLetterGuesses])).sort(),
  7: Array.from(new Set([...(worttrefferTargetsByLength[7] ?? []), ...sevenLetterGuesses])).sort(),
};

export const answerWords = Object.values(worttrefferTargetsByLength).flat();
export const guessWords = Object.values(worttrefferGuessWordsByLength).flat();
