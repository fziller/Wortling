import { getBerlinDateKey } from "@/daily/date";
import { pickSeededIndex } from "@/daily/seed";

import { CONTENT_VERSION, targetWords } from "./content";
import { createBetweenState } from "./engine";
import { BucketPreset, getTargetsForPreset } from "@/games/wordBuckets";
import { pickRandomTargetWithPack, pickTargetWithPack } from "../packs/selection";
import type { PacksSettings } from "@/storage/packs";

function getBetweenTargets(preset: BucketPreset = "klassisch"): readonly string[] {
  if (preset === "klassisch") return targetWords;
  return getTargetsForPreset(5, preset);
}

export function createDailyBetweenGame(date = new Date(), preset: BucketPreset = "klassisch", packs?: PacksSettings) {
  const dateKey = getBerlinDateKey(date);
  const seed = `${dateKey}:between:${CONTENT_VERSION}:${preset}`;
  const corePool = getBetweenTargets(preset);
  const targetWord = packs ? pickTargetWithPack(corePool, 5, packs, seed) : corePool[pickSeededIndex(seed, corePool.length)];

  return {
    dateKey,
    contentVersion: CONTENT_VERSION,
    state: createBetweenState(targetWord)
  };
}

export function createNextBetweenGame(previousTarget?: string, dateKey = "Freies Spiel", preset: BucketPreset = "klassisch", packs?: PacksSettings) {
  const corePool = getBetweenTargets(preset);
  const targetWord = packs
    ? pickRandomTargetWithPack(corePool, 5, packs, previousTarget)
    : (() => {
        const options = corePool.filter((word) => word !== previousTarget);
        return options[Math.floor(Math.random() * options.length)] ?? corePool[0];
      })();

  return {
    dateKey,
    contentVersion: CONTENT_VERSION,
    state: createBetweenState(targetWord)
  };
}
