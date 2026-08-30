import { hashSeed, pickSeededIndex } from "@/daily/seed";
import { bioTargetWordsByLength } from "./bio/generated/bioTargets";
import type { PackId, PackFrequency } from "../wordConfig";
import type { PacksSettings } from "@/storage/packs";
import { getWordLength, pickRandomTargetWord, pickRandomWordLength, supportedWordLengths } from "../wordLengths";

/**
 * Pool selection with packs.
 * - allowedGuesses: always merged (core ∪ bio) — independent of enabled flag
 * - targetWords: weighted by pack settings
 *   - normal: merged uniform (bio flows naturally into core pool)
 *   - haeufig: 70% bio / 30% core (deterministic via seeded roll)
 */

const BIO_BY_LENGTH = bioTargetWordsByLength as unknown as Record<number, readonly string[]>;
const HAUEFIG_BIO_PROB = 0.7;

export function getBioTargetsForLength(length: number): readonly string[] {
  return BIO_BY_LENGTH[length] ?? [];
}

export function getTargetsWithPack(
  coreTargets: readonly string[],
  length: number,
  packs: PacksSettings,
  seed: string,
  packId: PackId = "bio",
): readonly string[] | { pool: readonly string[]; weighted: boolean } {
  // Return extended pool for normal, or handle weighted pick externally.
  // This helper is for uniform merge; weighted case is handled by pickTargetWithPack.
  const bio = getBioTargetsForLength(length);
  if (!packs[packId]?.enabled || bio.length === 0) return coreTargets;
  const freq: PackFrequency = packs[packId].frequency ?? "normal";
  if (freq === "normal") {
    // Deduplicated merge
    const set = new Set([...coreTargets, ...bio]);
    return [...set];
  }
  // haeufig: keep pools separate — caller must do weighted roll
  return { pool: coreTargets, weighted: true } as unknown as readonly string[];
}

export function pickTargetWithPack(
  coreTargets: readonly string[],
  length: number,
  packs: PacksSettings,
  seed: string,
  packId: PackId = "bio",
): string {
  const bio = getBioTargetsForLength(length);
  if (!packs[packId]?.enabled || bio.length === 0 || coreTargets.length === 0) {
    // Fallback to core (or bio if core empty)
    const pool = coreTargets.length > 0 ? coreTargets : bio;
    return pool[pickSeededIndex(seed, pool.length)];
  }
  const freq = packs[packId].frequency ?? "normal";
  if (freq === "normal") {
    const merged = [...new Set([...coreTargets, ...bio])];
    return merged[pickSeededIndex(seed, merged.length)];
  }
  // haeufig: 70% bio / 30% core — deterministic via second hash
  const roll = (hashSeed(seed + ":pack") % 100) / 100;
  const useBio = roll < HAUEFIG_BIO_PROB;
  const pool = useBio ? bio : coreTargets;
  // Use derived seed so bio vs core picks don't collide across days
  const pickSeed = seed + (useBio ? ":bio" : ":core");
  return pool[pickSeededIndex(pickSeed, pool.length)];
}

export function pickRandomTargetWithPack(
  coreTargets: readonly string[],
  length: number,
  packs: PacksSettings,
  previousAnswer?: string,
): string {
  const bio = getBioTargetsForLength(length);
  if (!packs.bio?.enabled || bio.length === 0) {
    const options = coreTargets.filter((w) => w !== previousAnswer);
    const pool = options.length > 0 ? options : coreTargets;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  const freq = packs.bio.frequency ?? "normal";
  if (freq === "normal") {
    const merged = [...new Set([...coreTargets, ...bio])];
    const options = merged.filter((w) => w !== previousAnswer);
    const pool = options.length > 0 ? options : merged;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  // haeufig: 70/30 random
  const useBio = Math.random() < HAUEFIG_BIO_PROB;
  const source = useBio ? bio : coreTargets;
  const options = source.filter((w) => w !== previousAnswer);
  const pool = options.length > 0 ? options : source;
  return pool[Math.floor(Math.random() * pool.length)];
}

export type WordsByLength = Partial<Record<4 | 5 | 6 | 7, readonly string[]>>;

export function applyPacksToWordsByLength(
  coreByLength: WordsByLength,
  packs: PacksSettings,
): WordsByLength {
  if (!packs.bio?.enabled) return coreByLength;
  const freq = packs.bio.frequency ?? "normal";
  if (freq === "normal") {
    // Merge per length
    const merged: WordsByLength = {};
    for (const len of [4, 5, 6, 7] as const) {
      const core = coreByLength[len] ?? [];
      const bio = getBioTargetsForLength(len);
      if (bio.length === 0) merged[len] = core;
      else merged[len] = [...new Set([...core, ...bio])];
    }
    return merged;
  }
  // haeufig: keep core only here — weighted pick happens at word level
  // For uniform helpers we return merged anyway; weighted pick will use pickRandomTargetWithPack directly
  const merged: WordsByLength = {};
  for (const len of [4, 5, 6, 7] as const) {
    const core = coreByLength[len] ?? [];
    const bio = getBioTargetsForLength(len);
    merged[len] = bio.length ? [...new Set([...core, ...bio])] : core;
  }
  return merged;
}

export function pickRandomTargetWordWithPack(
  coreTargetsByLength: WordsByLength,
  packs: PacksSettings | undefined,
  previousAnswer?: string,
  weights?: readonly { length: 4 | 5 | 6 | 7; weight: number }[],
): { answer: string; wordLength: 4 | 5 | 6 | 7 } {
  if (!packs?.bio?.enabled) {
    return pickRandomTargetWord(coreTargetsByLength as any, previousAnswer, weights as any);
  }
  const freq = packs.bio.frequency ?? "normal";
  const mergedByLength = applyPacksToWordsByLength(coreTargetsByLength, packs);
  if (freq === "normal") {
    return pickRandomTargetWord(mergedByLength as any, previousAnswer, weights as any);
  }
  // haeufig: pick length from merged (so length weighting stays fair), then 70/30 word pick
  const validByLength = Object.fromEntries(
    supportedWordLengths.map((len) => [len, (mergedByLength[len] ?? []).filter((w) => getWordLength(w) === len)]),
  ) as Record<4 | 5 | 6 | 7, string[]>;
  const availableLengths = supportedWordLengths.filter((len) => validByLength[len].length > 0);
  const wordLength = pickRandomWordLength(availableLengths, weights);
  const core = coreTargetsByLength[wordLength] ?? [];
  const bio = getBioTargetsForLength(wordLength);
  const useBio = Math.random() < HAUEFIG_BIO_PROB && bio.length > 0;
  const source = useBio ? bio : core.length > 0 ? core : bio;
  const options = source.filter((w) => w !== previousAnswer);
  const pool = options.length > 0 ? options : source;
  const answer = pool[Math.floor(Math.random() * pool.length)];
  if (!answer) throw new Error("No target words available for supported word lengths.");
  return { answer, wordLength };
}
