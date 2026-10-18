#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { classifyWord, isTargetApproved, loadEnglishWords, loadReviewOverrides, normalizeWord } from "./pipeline/word-review.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, "..");
const cachePath = path.join(scriptDir, ".cache/word-import/english-50k.txt");
const overridesPath = path.join(scriptDir, "data/word-review-overrides.tsv");
const subtlexPath = path.join(scriptDir, "data/subtlex-de.tsv");

function parseArray(source, label) {
  const match = source.match(/= (\[[\s\S]*?\]) as const/);
  if (!match) throw new Error(`Could not parse generated list: ${label}`);
  return JSON.parse(match[1]);
}

function parsePuzzles(source) {
  const match = source.match(/generatedWabenwortPuzzles = (\[[\s\S]*?\]) as const/);
  if (!match) throw new Error("Could not parse Wabenwort puzzles.");
  return JSON.parse(match[1]);
}

const zipfByWord = new Map();
const rankByWord = new Map();
for (const [index, line] of (await readFile(subtlexPath, "utf8")).split("\n").slice(1).entries()) {
  const [rawWord, rawZipf] = line.split("\t");
  const zipf = Number(rawZipf);
  if (rawWord && Number.isFinite(zipf)) {
    const word = normalizeWord(rawWord);
    zipfByWord.set(word, zipf);
    if (!rankByWord.has(word)) rankByWord.set(word, index + 1);
  }
}
const [englishWords, overrides] = await Promise.all([loadEnglishWords(cachePath), loadReviewOverrides(overridesPath)]);
const allowedTargetsByLength = new Map();
const filesByLength = {
  4: ["src/games/wortleiter/generated/targetWords.ts", "src/games/wortleiter/generated/erweitertWords.ts", "src/games/wortleiter/generated/hartWords.ts"],
  5: ["src/games/between/generated/targetWords.ts", "src/games/between/generated/erweitertWords.ts", "src/games/between/generated/hartWords.ts"],
  6: ["src/games/wortcode/generated/targetWords.ts", "src/games/wortcode/generated/erweitertWords.ts", "src/games/wortcode/generated/hartWords.ts"],
  7: ["src/games/shared/generated/targetWords7.ts", "src/games/shared/generated/erweitertWords7.ts", "src/games/shared/generated/hartWords7.ts"],
  ...Object.fromEntries([8, 9, 10, 11, 12].map((length) => [length, [
    `src/games/wabenwort/generated/${length}/targetWords.ts`,
    `src/games/wabenwort/generated/${length}/erweitertWords.ts`,
    `src/games/wabenwort/generated/${length}/hartWords.ts`,
  ]])),
};

const failures = [];
for (const [length, files] of Object.entries(filesByLength)) {
  const canonicalTargets = new Set();
  for (const relativePath of files) {
    const words = parseArray(await readFile(path.join(appDir, relativePath), "utf8"), relativePath);
    for (const word of words) {
      const zipf = zipfByWord.get(word);
      const review = classifyWord({ word, zipf: zipf ?? 0, germanRank: rankByWord.get(word), englishWords, overrides });
      if (zipf === undefined) failures.push(`${relativePath}: ${word} is not in SUBTLEX-DE.`);
      else if (!isTargetApproved(review)) failures.push(`${relativePath}: ${word} is ${review.status} (${review.reason}).`);
      canonicalTargets.add(word);
    }
  }
  allowedTargetsByLength.set(Number(length), canonicalTargets);
}

const wabenwort = parsePuzzles(await readFile(path.join(appDir, "src/games/wabenwort/generated/puzzles.ts"), "utf8"));
for (const puzzle of wabenwort) {
  for (const entry of puzzle.words) {
    const targetPool = allowedTargetsByLength.get(Array.from(entry.word).length);
    if (!targetPool?.has(entry.word)) failures.push(`Wabenwort ${puzzle.id}: curated word ${entry.word} is not in a reviewed target list.`);
  }
}

if (failures.length) throw new Error(`Target-word validation failed:\n${failures.slice(0, 40).join("\n")}${failures.length > 40 ? `\n… ${failures.length - 40} more` : ""}`);
console.log(`Validated reviewed SUBTLEX-DE target words across ${Object.keys(filesByLength).length} lengths and ${wabenwort.length} Wabenwort puzzles.`);
