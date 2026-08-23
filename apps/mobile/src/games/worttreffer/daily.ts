import { getBerlinDateKey } from "@/daily/date";
import { getWordLength, isSupportedWordLength, pickRandomTargetWord, type SupportedWordLength, type WordLengthWeight } from "@/games/wordLengths";

import { WORTTREFFER_CONTENT_VERSION, worttrefferTargetsByLength } from "./content";
import { createWorttrefferState } from "./engine";
import { WorttrefferPuzzle } from "./types";

const maxAttemptsByLength = { 4: 5, 5: 6, 6: 7, 7: 8 } as const satisfies Record<SupportedWordLength, number>;
const worttrefferWordLengthWeights = [
  { length: 4, weight: 15 },
  { length: 5, weight: 40 },
  { length: 6, weight: 30 },
  { length: 7, weight: 15 },
] as const satisfies readonly WordLengthWeight[];

export function createDailyWorttrefferGame(date = new Date()) {
  const dateKey = getBerlinDateKey(date);

  return createPracticeWorttrefferGame(undefined, dateKey);
}

export function createPracticeWorttrefferGame(previousAnswer?: string, dateKey = "Freies Spiel") {
  const { answer, wordLength } = pickRandomTargetWord(worttrefferTargetsByLength, previousAnswer, worttrefferWordLengthWeights);
  const puzzle = createWorttrefferPuzzle(answer, wordLength, `worttreffer-practice-${Date.now()}`);

  return { dateKey, puzzle, state: createWorttrefferState(puzzle) };
}

export function getWorttrefferMaxAttempts(wordLength: SupportedWordLength): number {
  return maxAttemptsByLength[wordLength];
}

export function createWorttrefferPuzzle(answer: string, wordLength: SupportedWordLength, id: string): WorttrefferPuzzle {
  return {
    id,
    version: WORTTREFFER_CONTENT_VERSION,
    answer,
    wordLength,
    maxAttempts: getWorttrefferMaxAttempts(wordLength),
  };
}

export function restoreWorttrefferPuzzle(value: unknown): WorttrefferPuzzle | null {
  const item = value as Partial<WorttrefferPuzzle> | null | undefined;
  if (!item || typeof item.answer !== "string") return null;

  const inferredLength = getWordLength(item.answer);
  const wordLength = isSupportedWordLength(item.wordLength) ? item.wordLength : isSupportedWordLength(inferredLength) ? inferredLength : null;
  if (!wordLength || inferredLength !== wordLength) return null;

  return {
    id: typeof item.id === "string" ? item.id : `worttreffer-restored-${Date.now()}`,
    version: typeof item.version === "number" ? item.version : WORTTREFFER_CONTENT_VERSION,
    answer: item.answer,
    wordLength,
    maxAttempts: typeof item.maxAttempts === "number" && item.maxAttempts > 0 ? item.maxAttempts : getWorttrefferMaxAttempts(wordLength),
  };
}
