import { getBerlinDateKey } from "@/daily/date";
import { pickSeededIndex } from "@/daily/seed";

import { answerWords, WORTCODE_CONTENT_VERSION, WORTCODE_MAX_ATTEMPTS, WORTCODE_WORD_LENGTH } from "./content";
import { createWortcodeState } from "./engine";
import { WortcodePuzzle } from "./types";

export function createDailyWortcodeGame(date = new Date()) {
  const dateKey = getBerlinDateKey(date);
  const seed = `${dateKey}:wortcode:${WORTCODE_CONTENT_VERSION}`;
  const answer = answerWords[pickSeededIndex(seed, answerWords.length)];
  const puzzle = createWortcodePuzzle(answer, `wortcode-${dateKey}`);

  return { dateKey, puzzle, state: createWortcodeState(puzzle) };
}

export function createPracticeWortcodeGame(previousAnswer?: string) {
  const options = answerWords.filter((word) => word !== previousAnswer);
  const answer = options[Math.floor(Math.random() * options.length)] ?? answerWords[0];
  const puzzle = createWortcodePuzzle(answer, `wortcode-practice-${Date.now()}`);

  return { dateKey: "Freies Spiel", puzzle, state: createWortcodeState(puzzle) };
}

function createWortcodePuzzle(answer: string, id: string): WortcodePuzzle {
  return {
    id,
    version: WORTCODE_CONTENT_VERSION,
    answer,
    wordLength: WORTCODE_WORD_LENGTH,
    maxAttempts: WORTCODE_MAX_ATTEMPTS,
    difficulty: "medium" as const
  };
}
