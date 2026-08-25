import { generatedAllowedGuesses } from "./generated/allowedGuesses";

export const CONTENT_VERSION = "2026-08-18-b";
export const WORD_LENGTH = 5;

export const targetWords: string[] = [...(generatedAllowedGuesses as unknown as string[])].sort();

const generatedGuessSet = new Set<string>(generatedAllowedGuesses as unknown as string[]);
const missingTargetWords = targetWords.filter((word) => !generatedGuessSet.has(word));

export const allowedGuesses: string[] = missingTargetWords.length === 0
  ? [...(generatedAllowedGuesses as unknown as string[])]
  : [...(generatedAllowedGuesses as unknown as string[]), ...missingTargetWords].sort(new Intl.Collator("de-DE", { sensitivity: "base" }).compare);

export const targetWordCount = targetWords.length;
export const allowedGuessCount = allowedGuesses.length;
