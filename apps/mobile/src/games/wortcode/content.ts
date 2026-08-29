import { allowedGuesses as fiveLetterGuesses } from "../between/content";
import { generatedAllowedGuesses as sevenLetterGuesses } from "../shared/generated/allowedGuesses7";
import { generatedTargetWords as sevenLetterTargets } from "../shared/generated/targetWords7";
import type { WordsByLength } from "../wordLengths";

import { generatedAllowedGuesses as sixLetterGuesses } from "./generated/allowedGuesses";
import { generatedTargetWords as sixLetterTargets } from "./generated/targetWords";
import { generatedTargetWords as fiveLetterTargets } from "../between/generated/targetWords";

export const WORTCODE_CONTENT_VERSION = 5;

export const wortcodeTargetsByLength: WordsByLength = {
  5: [...(fiveLetterTargets as unknown as string[])],
  6: [...(sixLetterTargets as unknown as string[])],
  7: [...(sevenLetterTargets as unknown as string[])],
};

export const wortcodeGuessWordsByLength: WordsByLength = {
  5: Array.from(new Set([...(wortcodeTargetsByLength[5] ?? []), ...(fiveLetterGuesses as unknown as string[])])).sort(),
  6: Array.from(new Set([
    ...(wortcodeTargetsByLength[6] ?? []),
    ...(sixLetterGuesses as unknown as string[]),
    "ananas",
    "anders",
    "arbeit",
    "balkon",
    "besser",
    "bilder",
    "bitter",
    "blitze",
    "brille",
    "decken",
    "denken",
    "doppel",
    "dürfen",
    "farben",
    "finger",
    "flügel",
    "freude",
    "gabeln",
    "geigen",
    "gesund",
    "grenze",
    "halten",
    "himmel",
    "hunger",
    "kaufen",
    "keller",
    "kerzen",
    "kleine",
    "koffer",
    "kommen",
    "können",
    "lernen",
    "messer",
    "müssen",
    "preise",
    "reisen",
    "sachen",
    "singen",
    "spiele",
    "stille",
    "suchen",
    "teller",
    "trinke",
    "warten",
    "werden",
    "wissen",
    "wollen",
    "zahlen",
  ])).sort(),
  7: Array.from(new Set([...(wortcodeTargetsByLength[7] ?? []), ...(sevenLetterGuesses as unknown as string[])])).sort(),
};

export const answerWords = Object.values(wortcodeTargetsByLength).flat();
export const guessWords = Object.values(wortcodeGuessWordsByLength).flat();
