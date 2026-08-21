import { getBerlinDateKey } from "@/daily/date";
import { pickSeededIndex } from "@/daily/seed";

import { FORMWORT_CONTENT_VERSION, FORMWORT_MAX_ATTEMPTS, FORMWORT_WORD_LENGTH, formwortAnswers } from "./content";
import { createFormwortState, createFormwortSymbols } from "./engine";
import type { FormwortPuzzle } from "./types";

export function createDailyFormwortGame(date = new Date()) {
  const dateKey = getBerlinDateKey(date);
  const seed = `${dateKey}:formwort:${FORMWORT_CONTENT_VERSION}`;
  const answer = formwortAnswers[pickSeededIndex(seed, formwortAnswers.length)];
  const puzzle = createPuzzle(answer, `formwort-${dateKey}`);

  return { dateKey, puzzle, state: createFormwortState(puzzle) };
}

export function createPracticeFormwortGame(previousAnswer?: string) {
  const options = formwortAnswers.filter((word) => word !== previousAnswer);
  const answer = options[Math.floor(Math.random() * options.length)] ?? formwortAnswers[0];
  const puzzle = createPuzzle(answer, `formwort-practice-${Date.now()}`);

  return { dateKey: "Freies Spiel", puzzle, state: createFormwortState(puzzle) };
}

function createPuzzle(answer: string, id: string): FormwortPuzzle {
  return {
    id,
    version: FORMWORT_CONTENT_VERSION,
    answer,
    wordLength: FORMWORT_WORD_LENGTH,
    maxAttempts: FORMWORT_MAX_ATTEMPTS,
    symbols: createFormwortSymbols(answer)
  };
}
