import { getBerlinDateKey } from "@/daily/date";
import { pickSeededIndex } from "@/daily/seed";

import { answerWords, WORTTREFFER_CONTENT_VERSION, WORTTREFFER_MAX_ATTEMPTS, WORTTREFFER_WORD_LENGTH } from "./content";
import { createWorttrefferState } from "./engine";
import { WorttrefferPuzzle } from "./types";

export function createDailyWorttrefferGame(date = new Date()) {
  const dateKey = getBerlinDateKey(date);
  const seed = `${dateKey}:worttreffer:${WORTTREFFER_CONTENT_VERSION}`;
  const answer = answerWords[pickSeededIndex(seed, answerWords.length)];
  const puzzle = createWorttrefferPuzzle(answer, `worttreffer-${dateKey}`);

  return { dateKey, puzzle, state: createWorttrefferState(puzzle) };
}

export function createPracticeWorttrefferGame(previousAnswer?: string) {
  const options = answerWords.filter((word) => word !== previousAnswer);
  const answer = options[Math.floor(Math.random() * options.length)] ?? answerWords[0];
  const puzzle = createWorttrefferPuzzle(answer, `worttreffer-practice-${Date.now()}`);

  return { dateKey: "Freies Spiel", puzzle, state: createWorttrefferState(puzzle) };
}

function createWorttrefferPuzzle(answer: string, id: string): WorttrefferPuzzle {
  return {
    id,
    version: WORTTREFFER_CONTENT_VERSION,
    answer,
    wordLength: WORTTREFFER_WORD_LENGTH,
    maxAttempts: WORTTREFFER_MAX_ATTEMPTS
  };
}
