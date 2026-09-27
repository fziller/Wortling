#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, "..");
const outputPath = path.join(appDir, "src/games/wabenwort/generated/puzzles.ts");
const lengths = [4, 5, 6, 7, 8, 9, 10, 11, 12];
const sourceForLength = (length) => length === 4
  ? "src/games/wortleiter/generated/allowedGuesses.ts"
  : length === 5
    ? "src/games/between/generated/allowedGuesses.ts"
    : length === 6
      ? "src/games/wortcode/generated/allowedGuesses.ts"
      : length === 7
        ? "src/games/shared/generated/allowedGuesses7.ts"
        : `src/games/wabenwort/generated/${length}/allowedGuesses.ts`;
const metaSourceForLength = (length) => sourceForLength(length)
  .replace("allowedGuesses7.ts", "wordMeta7.ts")
  .replace("allowedGuesses.ts", "wordMeta.ts");

function parseGeneratedArray(fileText) {
  const match = fileText.match(/= (\[[\s\S]*?\]) as const/);
  if (!match) throw new Error("Generated word array not found.");
  return JSON.parse(match[1]);
}

function uniqueLetters(word) {
  return [...new Set(Array.from(word))].sort().join("");
}

function score(word, letters) {
  const base = word.length === 4 ? 1 : word.length;
  return base + (uniqueLetters(word) === letters ? 7 : 0);
}

function buildPuzzles(words, allowedWords) {
  const wordEntries = [...new Set(words)].map((word) => ({ word, letters: uniqueLetters(word) }));
  const allowedEntries = [...new Set(allowedWords)].map((word) => ({ word, letters: uniqueLetters(word) }));
  const letterSets = [...new Set(wordEntries.map((entry) => entry.letters).filter((letters) => letters.length === 7))];

  const puzzles = [];
  for (const letters of letterSets) {
    for (const centerLetter of letters) {
    const entries = wordEntries
      .filter((entry) => entry.word.includes(centerLetter) && [...entry.letters].every((letter) => letters.includes(letter)))
      .map((entry) => entry.word)
      .map((word) => ({ word, score: score(word, letters), isPangram: uniqueLetters(word) === letters }))
      .sort((a, b) => a.word.length - b.word.length || a.word.localeCompare(b.word, "de"));
    const pangrams = entries.filter((entry) => entry.isPangram);
    const longWords = entries.filter((entry) => entry.word.length >= 8);
    if (entries.length < 8 || !pangrams.length || longWords.length < 1) continue;

    const totalScore = entries.reduce((total, entry) => total + entry.score, 0);
    const goldScore = Math.max(28, Math.min(Math.floor(totalScore * 0.5), totalScore - 1));
    const silverScore = Math.max(14, Math.floor(goldScore * 0.62));
    const bronzeScore = Math.max(6, Math.floor(silverScore * 0.5));
    const curatedWords = new Set(entries.map((entry) => entry.word));
    const allowedForPuzzle = allowedEntries
      .filter((entry) => entry.word.includes(centerLetter) && [...entry.letters].every((letter) => letters.includes(letter)))
      .map((entry) => entry.word);
    const allowedWords = [...new Set([...entries.map((entry) => entry.word), ...allowedForPuzzle])]
      .sort((a, b) => Number(curatedWords.has(b)) - Number(curatedWords.has(a)) || a.length - b.length || a.localeCompare(b, "de"));
    // No cap on the word pool: every validated word counts. Ranks are word-count
    // goals instead, with gold capped so a perfect round stays reachable.
    const total = allowedWords.length;
    const goldWords = Math.min(60, Math.max(10, Math.round(total * 0.4)));
    const silverWords = Math.max(6, Math.min(Math.floor(goldWords * 0.6), goldWords - 2));
    const bronzeWords = Math.max(3, Math.min(Math.floor(silverWords * 0.5), silverWords - 1));
    puzzles.push({
      id: `wabe-${letters}-${centerLetter}`,
      letters: Array.from(letters),
      centerLetter,
      words: entries,
      allowedWords,
      bronzeWords,
      silverWords,
      goldWords,
      bronzeScore,
      silverScore,
      goldScore,
      totalScore,
    });
    }
  }
  return puzzles
    .sort((a, b) => b.words.length - a.words.length || a.id.localeCompare(b.id, "de"))
    .slice(0, 360)
    .sort((a, b) => a.id.localeCompare(b.id, "de"));
}

const imported = await Promise.all(lengths.map(async (length) => ({
  words: parseGeneratedArray(await readFile(path.join(appDir, sourceForLength(length)), "utf8")),
  meta: parseGeneratedArray(await readFile(path.join(appDir, metaSourceForLength(length)), "utf8")),
})));
const qualityWords = new Set(imported.flatMap(({ meta }) => meta
  .filter((item) => item.zipf >= 2.9 && item.bucket === "base")
  .map((item) => item.word)));
const words = imported.flatMap(({ words }) => words.filter((word) => qualityWords.has(word)));
const allowedWords = new Set(imported.flatMap(({ meta }) => meta
  .filter((item) => item.zipf >= 2.9)
  .map((item) => item.word)));
const puzzles = buildPuzzles(words, allowedWords);
if (puzzles.length < 30) throw new Error(`Only ${puzzles.length} Wabenwort puzzles passed quality checks.`);

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  "// Generated by scripts/generate-wabenwort-puzzles.mjs. Do not edit by hand.\n" +
    "// Seven-letter honeycombs with validated 4–12 letter German words.\n" +
    `export const generatedWabenwortPuzzles = ${JSON.stringify(puzzles, null, 2)} as const;\n`,
  "utf8",
);
console.log(`Generated ${puzzles.length} Wabenwort puzzles at ${path.relative(process.cwd(), outputPath)}.`);
