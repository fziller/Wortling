import { getBerlinDateKey } from "@/daily/date";
import { hashSeed, pickSeededIndex } from "@/daily/seed";

import { GALGENWORT_CONTENT_VERSION, galgenwortPuzzles } from "./content";
import { createGalgenwortState } from "./engine";
import { BucketPreset } from "@/games/wordBuckets";
import { getGalgenwortPuzzlesForPreset } from "./content";
import { getBioTargetsForLength } from "../packs/selection";
import type { PacksSettings } from "@/storage/packs";
import { galgenwortPoolsByPreset } from "./content";
import type { GalgenwortPuzzle } from "./types";

function buildBioPuzzlePool(): string[] {
  const allBio = [4, 5, 6, 7].flatMap((len) => [...getBioTargetsForLength(len)]);
  return allBio.filter((w) => /^[a-zäöü]{4,10}$/u.test(w) && !/[qx]/u.test(w));
}

function getPoolWithPack(preset: BucketPreset, packs?: PacksSettings): GalgenwortPuzzle[] {
  const corePool = galgenwortPoolsByPreset[preset] ?? galgenwortPoolsByPreset.klassisch;
  if (!packs?.bio?.enabled) return getGalgenwortPuzzlesForPreset(preset);
  const bioPool = buildBioPuzzlePool();
  if (bioPool.length === 0) return getGalgenwortPuzzlesForPreset(preset);
  const freq = packs.bio.frequency ?? "normal";
  if (freq === "normal") {
    const merged = [...new Set([...corePool, ...bioPool])];
    return merged.map((answer, i) => ({ id: `galgenwort-${String(i + 1).padStart(4, "0")}`, version: GALGENWORT_CONTENT_VERSION, answer, clue: "", maxWrongGuesses: 8 } as GalgenwortPuzzle));
  }
  // haeufig is handled at pick time, not pool level — return core+ bio merged for uniformity
  const merged = [...new Set([...corePool, ...bioPool])];
  return merged.map((answer, i) => ({ id: `galgenwort-${String(i + 1).padStart(4, "0")}`, version: GALGENWORT_CONTENT_VERSION, answer, clue: "", maxWrongGuesses: 8 } as GalgenwortPuzzle));
}

function pickWeightedPuzzle(pool: GalgenwortPuzzle[], coreSize: number, bioSize: number, seed: string, packs?: PacksSettings, previousId?: string): GalgenwortPuzzle {
  if (!packs?.bio?.enabled || packs.bio.frequency !== "haeufig" || bioSize === 0) {
    if (previousId) {
      const opts = pool.filter((p) => p.id !== previousId);
      return opts[Math.floor(Math.random() * opts.length)] ?? pool[0];
    }
    return pool[pickSeededIndex(seed, pool.length)];
  }
  // haeufig: 70% bio, 30% core
  const bioPuzzles = pool.slice(coreSize);
  const corePuzzles = pool.slice(0, coreSize);
  const useBio = previousId ? Math.random() < 0.7 : (hashSeed(seed + ":pack") % 100) / 100 < 0.7;
  const source = useBio ? bioPuzzles : corePuzzles;
  if (previousId) {
    const opts = source.filter((p) => p.id !== previousId);
    if (opts.length > 0) return opts[Math.floor(Math.random() * opts.length)] ?? source[0];
  }
  const pickSeed = seed + (useBio ? ":bio" : ":core");
  return source[pickSeededIndex(pickSeed, source.length)] ?? pool[0];
}

export function createDailyGalgenwortGame(date = new Date(), preset: BucketPreset = "klassisch", packs?: PacksSettings) {
  const dateKey = getBerlinDateKey(date);
  const seed = `${dateKey}:galgenwort:${GALGENWORT_CONTENT_VERSION}:${preset}`;
  const pool = getPoolWithPack(preset, packs);
  // For haeufig, use weighted pick with core size
  const coreSize = galgenwortPoolsByPreset[preset]?.length ?? galgenwortPuzzles.length;
  const bioSize = pool.length - coreSize;
  const puzzle = pickWeightedPuzzle(pool, coreSize, bioSize, seed, packs);

  return { dateKey, puzzle, state: createGalgenwortState(puzzle) };
}

export function createNextGalgenwortGame(previousPuzzleId?: string, dateKey = "Freies Spiel", preset: BucketPreset = "klassisch", packs?: PacksSettings) {
  const pool = getPoolWithPack(preset, packs);
  const coreSize = galgenwortPoolsByPreset[preset]?.length ?? galgenwortPuzzles.length;
  const bioSize = pool.length - coreSize;
  const seed = `${dateKey}:galgenwort:${preset}:${previousPuzzleId ?? ""}`;
  const puzzle = pickWeightedPuzzle(pool, coreSize, bioSize, seed, packs, previousPuzzleId);

  return { dateKey, puzzle, state: createGalgenwortState(puzzle) };
}
