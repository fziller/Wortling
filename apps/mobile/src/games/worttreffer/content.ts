import { allowedGuesses as fiveLetterGuesses } from "../between/content";
import { getAllAllowedGuesses } from "../packs/allowed";
import { generatedTargetWords as fourLetterTargets } from "../wortleiter/generated/targetWords";
import { generatedTargetWords as fiveLetterTargets } from "../between/generated/targetWords";
import { generatedTargetWords as sixLetterTargets } from "../wortcode/generated/targetWords";
import { generatedTargetWords as sevenLetterTargets } from "../shared/generated/targetWords7";
import type { WordsByLength } from "../wordLengths";

export const WORTTREFFER_CONTENT_VERSION = 6;

export const worttrefferTargetsByLength: WordsByLength = {
  4: [...(fourLetterTargets as unknown as string[])],
  5: [...(fiveLetterTargets as unknown as string[])],
  6: [...(sixLetterTargets as unknown as string[])],
  7: [...(sevenLetterTargets as unknown as string[])],
};

export const worttrefferGuessWordsByLength: WordsByLength = {
  4: Array.from(new Set([...(worttrefferTargetsByLength[4] ?? []), ...getAllAllowedGuesses(4)])).sort(),
  5: Array.from(new Set([...(worttrefferTargetsByLength[5] ?? []), ...fiveLetterGuesses])).sort(),
  6: Array.from(new Set([...(worttrefferTargetsByLength[6] ?? []), ...getAllAllowedGuesses(6)])).sort(),
  7: Array.from(new Set([...(worttrefferTargetsByLength[7] ?? []), ...getAllAllowedGuesses(7)])).sort(),
};

export const answerWords = Object.values(worttrefferTargetsByLength).flat();
export const guessWords = Object.values(worttrefferGuessWordsByLength).flat();
