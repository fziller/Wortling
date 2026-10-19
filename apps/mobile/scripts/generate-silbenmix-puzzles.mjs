#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createGermanHyphenator } from "./silbenmix-hyphenation.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, "..");
const outputPath = path.join(appDir, "src/games/silbenmix/generated/puzzles.json");
const patternPath = path.join(appDir, "scripts/data/hyph-de-1996.pat.txt");
// No output cap: retain every fair unique candidate discovered by this fixed,
// reproducible search budget. Exhaustively combining thousands of words would
// be combinatorially infeasible at build time.
const SEARCH_ATTEMPTS_PER_DIFFICULTY = 250_000;
const random = mulberry32(0x51_1B_EA);

const inputPaths = [
  "src/games/wortleiter/generated/targetWords.ts",
  "src/games/between/generated/targetWords.ts",
  "src/games/wortcode/generated/targetWords.ts",
  "src/games/shared/generated/targetWords7.ts",
  "src/games/wabenwort/generated/8/targetWords.ts",
  "src/games/wabenwort/generated/9/targetWords.ts",
  "src/games/wabenwort/generated/10/targetWords.ts",
  "src/games/wabenwort/generated/11/targetWords.ts",
  "src/games/wabenwort/generated/12/targetWords.ts",
];

const tiers = [
  { difficulty: "medium", wordCount: 3, minSyllables: 10, maxSyllables: 12 },
  { difficulty: "hard", wordCount: 4, minSyllables: 12, maxSyllables: 15, minLongWordSyllables: 4 },
  { difficulty: "hard", wordCount: 5, minSyllables: 15, maxSyllables: 18, minLongWordSyllables: 4 },
];

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function parseGeneratedArray(source, sourcePath) {
  const match = source.match(/= (\[[\s\S]*?\]) as const/);
  if (!match) throw new Error(`Could not parse word list: ${sourcePath}`);
  return JSON.parse(match[1]);
}

function countSyllables(values) {
  const count = new Map();
  for (const value of values) count.set(value, (count.get(value) ?? 0) + 1);
  return count;
}

function containsAll(available, required) {
  for (const [value, count] of required) if ((available.get(value) ?? 0) < count) return false;
  return true;
}

function subtract(available, required) {
  const next = new Map(available);
  for (const [value, count] of required) {
    const remaining = (next.get(value) ?? 0) - count;
    if (remaining <= 0) next.delete(value);
    else next.set(value, remaining);
  }
  return next;
}

function getRemainingCount(values) {
  let total = 0;
  for (const value of values.values()) total += value;
  return total;
}

function isUniquelySolvable(targets, candidatesByFirstSyllable) {
  const pool = countSyllables(targets.flatMap((target) => target.syllables));
  const targetKey = [...targets.map((target) => target.word)].sort().join("|");
  let solutionCount = 0;
  const seen = new Set();

  function visit(available, chosen) {
    if (solutionCount > 1) return;
    if (getRemainingCount(available) === 0) {
      const key = [...chosen].sort().join("|");
      if (!seen.has(key)) {
        seen.add(key);
        solutionCount += 1;
      }
      return;
    }

    const anchors = [...available.keys()]
      .map((syllable) => ({ syllable, options: candidatesByFirstSyllable.get(syllable) ?? [] }))
      .filter((entry) => entry.options.length > 0)
      .sort((left, right) => left.options.length - right.options.length || left.syllable.localeCompare(right.syllable, "de-DE"));
    const anchor = anchors[0];
    if (!anchor) return;

    for (const candidate of anchor.options) {
      if (!containsAll(available, candidate.syllableCounts)) continue;
      visit(subtract(available, candidate.syllableCounts), [...chosen, candidate.word]);
    }
  }

  visit(pool, []);
  return solutionCount === 1 && seen.has(targetKey);
}

function shuffled(values) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

const patternSource = await readFile(patternPath, "utf8");
const hyphenate = createGermanHyphenator(patternSource);
const rawWords = (await Promise.all(inputPaths.map(async (sourcePath) =>
  parseGeneratedArray(await readFile(path.join(appDir, sourcePath), "utf8"), sourcePath),
))).flat();

const words = [...new Set(rawWords)]
  .map((word) => ({ word, syllables: hyphenate(word) }))
  .filter(({ word, syllables }) => /^[a-zäöü]+$/u.test(word) && syllables.length >= 2 && syllables.length <= 5)
  .filter(({ syllables }) => syllables.every((syllable) => Array.from(syllable).length >= 2))
  .map((item) => ({ ...item, syllableCounts: countSyllables(item.syllables) }));

const candidatesByFirstSyllable = new Map();
for (const word of words) {
  const first = word.syllables[0];
  candidatesByFirstSyllable.set(first, [...(candidatesByFirstSyllable.get(first) ?? []), word]);
}

const generated = [];
for (const tier of tiers) {
  const selected = [];
  const seen = new Set();
  for (let attempt = 0; attempt < SEARCH_ATTEMPTS_PER_DIFFICULTY; attempt += 1) {
    const targets = shuffled(words).slice(0, tier.wordCount);
    const totalSyllables = targets.reduce((sum, target) => sum + target.syllables.length, 0);
    if (new Set(targets.map((target) => target.word)).size !== tier.wordCount) continue;
    if (totalSyllables < tier.minSyllables || totalSyllables > tier.maxSyllables) continue;
    if (new Set(targets.map((target) => target.syllables.length)).size < 2) continue;
    if (tier.minLongWordSyllables && !targets.some((target) => target.syllables.length >= tier.minLongWordSyllables)) continue;

    const key = [...targets.map((target) => target.word)].sort().join("|");
    if (seen.has(key) || !isUniquelySolvable(targets, candidatesByFirstSyllable)) continue;
    seen.add(key);
    selected.push({ difficulty: tier.difficulty, targets, totalSyllables });
  }

  if (selected.length < 40) {
    throw new Error(`Silbenmix ${tier.difficulty}: only ${selected.length} fair candidates (need at least 40).`);
  }
  generated.push(...selected);
  console.log(`Silbenmix ${tier.difficulty}: ${selected.length} fair candidates.`);
}

const wordBank = [];
const wordIndexByKey = new Map();
function wordIndex(target) {
  const key = `${target.word}\u0000${target.syllables.join("\u0000")}`;
  const existing = wordIndexByKey.get(key);
  if (existing !== undefined) return existing;
  const index = wordBank.length;
  wordBank.push({ word: target.word, syllables: target.syllables });
  wordIndexByKey.set(key, index);
  return index;
}

const puzzles = generated.map((item, index) => {
  const flattened = item.targets.flatMap((target) => target.syllables);
  return {
  id: `silbenmix-${String(index + 1).padStart(4, "0")}`,
   version: 2,
  difficulty: item.difficulty,
  targetIndexes: item.targets.map(wordIndex),
  tileOrder: shuffled(flattened.map((_, syllableIndex) => syllableIndex)),
  syllableCount: item.totalSyllables,
  };
});

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  JSON.stringify({ generatedSilbenmixWords: wordBank, generatedSilbenmixPuzzles: puzzles }),
  "utf8",
);
console.log(`Generated ${puzzles.length} Silbenmix puzzles.`);
