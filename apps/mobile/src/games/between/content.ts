import { generatedAllowedGuesses } from "./generated/allowedGuesses";
import { generatedTargetWords } from "./generated/targetWords";
import { getAllAllowedGuesses } from "../packs/allowed";

export const CONTENT_VERSION = "2026-08-28";
export const WORD_LENGTH = 5;

// Targets = easy+medium (Zipf ≥2.2) via SUBTLEX-DE/FrequencyWords; allowed = full dict. Hard/unknown stay guess-only ("better have than need").
// allowedGuesses always includes all packs (bio etc) even when pack is disabled — only targets are gated.
export const targetWords: string[] = [...(generatedTargetWords as unknown as string[])];

const mergedAllowed = getAllAllowedGuesses(5) as string[];
const mergedSet = new Set<string>(mergedAllowed);
const missingTargetWords = targetWords.filter((word) => !mergedSet.has(word));

export const allowedGuesses: string[] = missingTargetWords.length === 0
  ? mergedAllowed
  : [...mergedAllowed, ...missingTargetWords].sort(new Intl.Collator("de-DE", { sensitivity: "base" }).compare);

export const targetWordCount = targetWords.length;
export const allowedGuessCount = allowedGuesses.length;
