import { getBerlinDateKey } from "@/daily/date";
import { getWordLength, isSupportedWordLength, pickRandomTargetWord, type SupportedWordLength } from "@/games/wordLengths";

import { FORMWORT_CONTENT_VERSION, formwortTargetsByLength } from "./content";
import { createFormwortState, createFormwortSymbols } from "./engine";
import type { FormwortPuzzle } from "./types";

type FormwortWordLength = Exclude<SupportedWordLength, 4>;

const maxAttemptsByLength = { 5: 6, 6: 7, 7: 8 } as const satisfies Record<FormwortWordLength, number>;

export function createDailyFormwortGame(date = new Date()) {
  const dateKey = getBerlinDateKey(date);

  return createPracticeFormwortGame(undefined, dateKey);
}

export function createPracticeFormwortGame(previousAnswer?: string, dateKey = "Freies Spiel") {
  const { answer, wordLength } = pickRandomTargetWord(formwortTargetsByLength, previousAnswer);
  if (!isFormwortWordLength(wordLength)) throw new Error("Formwort only supports 5- to 7-letter words.");
  const puzzle = createFormwortPuzzle(answer, wordLength, `formwort-practice-${Date.now()}`);

  return { dateKey, puzzle, state: createFormwortState(puzzle) };
}

export function getFormwortMaxAttempts(wordLength: FormwortWordLength): number {
  return maxAttemptsByLength[wordLength];
}

export function createFormwortPuzzle(answer: string, wordLength: FormwortWordLength, id: string): FormwortPuzzle {
  return {
    id,
    version: FORMWORT_CONTENT_VERSION,
    answer,
    wordLength,
    maxAttempts: getFormwortMaxAttempts(wordLength),
    symbols: createFormwortSymbols(answer)
  };
}

export function restoreFormwortPuzzle(value: unknown): FormwortPuzzle | null {
  const item = value as Partial<FormwortPuzzle> | null | undefined;
  if (!item || typeof item.answer !== "string") return null;

  const inferredLength = getWordLength(item.answer);
  const wordLength = isFormwortWordLength(item.wordLength) ? item.wordLength : isFormwortWordLength(inferredLength) ? inferredLength : null;
  if (!wordLength || inferredLength !== wordLength) return null;

  const symbols = Array.isArray(item.symbols) && item.symbols.length === wordLength ? item.symbols.map(String) : createFormwortSymbols(item.answer);

  return {
    id: typeof item.id === "string" ? item.id : `formwort-restored-${Date.now()}`,
    version: typeof item.version === "number" ? item.version : FORMWORT_CONTENT_VERSION,
    answer: item.answer,
    wordLength,
    maxAttempts: typeof item.maxAttempts === "number" && item.maxAttempts > 0 ? item.maxAttempts : getFormwortMaxAttempts(wordLength),
    symbols,
  };
}

function isFormwortWordLength(value: unknown): value is FormwortWordLength {
  return isSupportedWordLength(value) && value !== 4;
}
