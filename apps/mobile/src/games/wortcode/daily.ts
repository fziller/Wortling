import { getBerlinDateKey } from "@/daily/date";
import { pickSeededIndex } from "@/daily/seed";

import { answerWords, WORTCODE_CONTENT_VERSION, WORTCODE_MAX_ATTEMPTS, WORTCODE_WORD_LENGTH } from "./content";
import { createWortcodeState } from "./engine";

export function createDailyWortcodeGame(date = new Date()) {
  const dateKey = getBerlinDateKey(date);
  const seed = `${dateKey}:wortcode:${WORTCODE_CONTENT_VERSION}`;
  const answer = answerWords[pickSeededIndex(seed, answerWords.length)];
  const puzzle = {
    id: `wortcode-${dateKey}`,
    version: WORTCODE_CONTENT_VERSION,
    answer,
    wordLength: WORTCODE_WORD_LENGTH,
    maxAttempts: WORTCODE_MAX_ATTEMPTS,
    difficulty: "medium" as const
  };

  return { dateKey, puzzle, state: createWortcodeState(puzzle) };
}
