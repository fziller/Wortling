import { getBerlinDateKey } from "@/daily/date";
import { pickSeededIndex } from "@/daily/seed";

import { CONTENT_VERSION, targetWords } from "./content";
import { createBetweenState } from "./engine";

export function createDailyBetweenGame(date = new Date()) {
  const dateKey = getBerlinDateKey(date);
  const seed = `${dateKey}:between:${CONTENT_VERSION}`;
  const targetWord = targetWords[pickSeededIndex(seed, targetWords.length)];

  return {
    dateKey,
    contentVersion: CONTENT_VERSION,
    state: createBetweenState(targetWord)
  };
}
