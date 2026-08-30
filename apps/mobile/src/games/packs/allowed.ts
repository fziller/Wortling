// allowedGuesses is always core ∪ all packs (independent of enabled flag).
// This ensures bio words are guessable even when the pack is disabled — only targets are gated.
import { generatedAllowedGuesses as allowed4 } from "../wortleiter/generated/allowedGuesses";
import { generatedAllowedGuesses as allowed5 } from "../between/generated/allowedGuesses";
import { generatedAllowedGuesses as allowed6 } from "../wortcode/generated/allowedGuesses";
import { generatedAllowedGuesses as allowed7 } from "../shared/generated/allowedGuesses7";
import { bioAllowedWordsByLength } from "./bio/generated/bioTargets";

const coreByLength: Record<number, readonly string[]> = {
  4: allowed4 as unknown as string[],
  5: allowed5 as unknown as string[],
  6: allowed6 as unknown as string[],
  7: allowed7 as unknown as string[],
};

const bioByLength = bioAllowedWordsByLength as unknown as Record<number, readonly string[]>;

const mergedByLengthCache = new Map<number, Set<string>>();
const mergedListCache = new Map<number, string[]>();

export function getAllAllowedGuesses(length: number): readonly string[] {
  if (mergedListCache.has(length)) return mergedListCache.get(length)!;
  const core = coreByLength[length] ?? [];
  const bio = bioByLength[length] ?? [];
  const merged = [...new Set([...core, ...bio])].sort(new Intl.Collator("de-DE", { sensitivity: "base" }).compare);
  mergedListCache.set(length, merged);
  mergedByLengthCache.set(length, new Set(merged));
  return merged;
}

export function getAllAllowedGuessesSet(length: number): Set<string> {
  if (!mergedByLengthCache.has(length)) getAllAllowedGuesses(length);
  return mergedByLengthCache.get(length)!;
}

export function isAllowedGuess(word: string, length?: number): boolean {
  const normalized = word.normalize("NFC").trim().toLocaleLowerCase("de-DE").replace(/ß/g, "ss");
  if (length && mergedByLengthCache.has(length)) {
    return getAllAllowedGuessesSet(length).has(normalized);
  }
  // Check all lengths if no length given
  for (const len of [4, 5, 6, 7]) {
    if (getAllAllowedGuessesSet(len).has(normalized)) return true;
  }
  return false;
}

// Flat set for engines that validate without length (e.g. worttreffer guessWords)
const allAllowedFlat = new Set<string>([4, 5, 6, 7].flatMap((len) => [...getAllAllowedGuesses(len)] as string[]));
export const allAllowedGuessesSet = allAllowedFlat;
export const allAllowedGuessesList = [...allAllowedFlat].sort(new Intl.Collator("de-DE", { sensitivity: "base" }).compare);
