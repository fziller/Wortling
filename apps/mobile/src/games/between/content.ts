import { generatedAllowedGuesses } from "./generated/allowedGuesses";
import { generatedTargetWords } from "./generated/targetWords";

export const CONTENT_VERSION = "2026-08-28";
export const WORD_LENGTH = 5;

// Targets = easy+medium (Zipf ≥2.2) via SUBTLEX-DE/FrequencyWords; allowed = full dict. Hard/unknown stay guess-only ("better have than need").
export const targetWords: string[] = [...(generatedTargetWords as unknown as string[])];

const generatedGuessSet = new Set<string>(generatedAllowedGuesses as unknown as string[]);
const missingTargetWords = targetWords.filter((word) => !generatedGuessSet.has(word));

export const allowedGuesses: string[] = missingTargetWords.length === 0
  ? [...(generatedAllowedGuesses as unknown as string[])]
  : [...(generatedAllowedGuesses as unknown as string[]), ...missingTargetWords].sort(new Intl.Collator("de-DE", { sensitivity: "base" }).compare);

export const targetWordCount = targetWords.length;
export const allowedGuessCount = allowedGuesses.length;
