import { getBerlinDateKey } from "@/daily/date";

import { CONTENT_VERSION, targetWords } from "./content";
import { createBetweenState } from "./engine";
import { BucketPreset, getTargetsForPreset } from "@/games/wordBuckets";
import { pickRandomTargetWithPack } from "../packs/selection";
import type { PacksSettings } from "@/storage/packs";
import { pickFreshRound } from "@/storage/recentRounds";

function getBetweenTargets(preset: BucketPreset = "klassisch"): readonly string[] {
  if (preset === "klassisch") return targetWords;
  return getTargetsForPreset(5, preset);
}

export function createDailyBetweenGame(date = new Date(), preset: BucketPreset = "klassisch", packs?: PacksSettings) {
  return createNextBetweenGame(undefined, getBerlinDateKey(date), preset, packs);
}

export function createNextBetweenGame(previousTarget?: string, dateKey = "Freies Spiel", preset: BucketPreset = "klassisch", packs?: PacksSettings) {
  const corePool = getBetweenTargets(preset);
  const targetWord = pickFreshRound("between", () => packs
    ? pickRandomTargetWithPack(corePool, 5, packs, previousTarget)
    : (() => {
        const options = corePool.filter((word) => word !== previousTarget);
        return options[Math.floor(Math.random() * options.length)] ?? corePool[0];
      })(), (candidate) => candidate);

  return {
    dateKey,
    contentVersion: CONTENT_VERSION,
    state: createBetweenState(targetWord)
  };
}
