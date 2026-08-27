import { getBerlinDateKey } from "@/daily/date";
import { pickSeededIndex } from "@/daily/seed";

import { CONTENT_VERSION, targetWords } from "./content";
import { createBetweenState } from "./engine";
import { BucketPreset, getTargetsForPreset } from "@/games/wordBuckets";

function getBetweenTargets(preset: BucketPreset = "klassisch"): readonly string[] {
  if (preset === "klassisch") return targetWords;
  return getTargetsForPreset(5, preset);
}

export function createDailyBetweenGame(date = new Date(), preset: BucketPreset = "klassisch") {
  const dateKey = getBerlinDateKey(date);
  const seed = `${dateKey}:between:${CONTENT_VERSION}:${preset}`;
  const pool = getBetweenTargets(preset);
  const targetWord = pool[pickSeededIndex(seed, pool.length)];

  return {
    dateKey,
    contentVersion: CONTENT_VERSION,
    state: createBetweenState(targetWord)
  };
}

export function createNextBetweenGame(previousTarget?: string, dateKey = "Freies Spiel", preset: BucketPreset = "klassisch") {
  const pool = getBetweenTargets(preset);
  const options = pool.filter((word) => word !== previousTarget);
  const targetWord = options[Math.floor(Math.random() * options.length)] ?? pool[0];

  return {
    dateKey,
    contentVersion: CONTENT_VERSION,
    state: createBetweenState(targetWord)
  };
}
