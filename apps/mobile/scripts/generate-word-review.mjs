#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { classifyWord, loadEnglishWords, loadReviewOverrides } from "./pipeline/word-review.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, "..");
const reviewDir = path.join(scriptDir, "reports/word-review");
const cachePath = path.join(scriptDir, ".cache/word-import/english-50k.txt");
const overridesPath = path.join(scriptDir, "data/word-review-overrides.tsv");
const subtlexPath = path.join(scriptDir, "data/subtlex-de.tsv");

const metaPaths = [
  "src/games/wortleiter/generated/wordMeta.ts",
  "src/games/between/generated/wordMeta.ts",
  "src/games/wortcode/generated/wordMeta.ts",
  "src/games/shared/generated/wordMeta7.ts",
  ...[8, 9, 10, 11, 12].map((length) => `src/games/wabenwort/generated/${length}/wordMeta.ts`),
];
const rejectionReportPaths = [4, 5, 6, 7, 8, 9, 10, 11, 12]
  .map((length) => path.join(reviewDir, `rejected-english-${length}.tsv`));

function parseMeta(source, sourcePath) {
  const match = source.match(/generatedWordMeta = (\[[\s\S]*?\]) as const/);
  if (!match) throw new Error(`Could not parse word metadata: ${sourcePath}`);
  return JSON.parse(match[1]);
}

const [englishWords, overrides] = await Promise.all([loadEnglishWords(cachePath), loadReviewOverrides(overridesPath)]);
const germanRanks = new Map();
for (const [index, line] of (await readFile(subtlexPath, "utf8")).split("\n").slice(1).entries()) {
  const [word] = line.split("\t");
  if (word && !germanRanks.has(word)) germanRanks.set(word, index + 1);
}
const words = new Map();
for (const relativePath of metaPaths) {
  const meta = parseMeta(await readFile(path.join(appDir, relativePath), "utf8"), relativePath);
  for (const item of meta) {
    const current = words.get(item.word);
    words.set(item.word, { ...item, lengths: [...new Set([...(current?.lengths ?? []), item.word.length])].sort((a, b) => a - b) });
  }
}

const rows = [...words.values()]
  .map((item) => ({ ...item, ...classifyWord({ word: item.word, zipf: item.zipf, germanRank: germanRanks.get(item.word), englishWords, overrides }) }))
  .filter((item) => item.status !== "approved")
  .sort((a, b) => a.status.localeCompare(b.status) || a.word.localeCompare(b.word, "de"));
const rejectedRows = (await Promise.all(rejectionReportPaths.map(async (reportPath) => {
  try {
    return (await readFile(reportPath, "utf8")).split("\n").slice(1).filter(Boolean);
  } catch {
    return [];
  }
}))).flat();

await mkdir(reviewDir, { recursive: true });
const header = "word\tstatus\tzipf\tbucket\tlengths\treason\n";
const format = (items) => header + items.map((item) => [item.word, item.status, item.zipf, item.bucket, item.lengths.join(","), item.reason].join("\t")).join("\n") + "\n";
await Promise.all([
  writeFile(path.join(reviewDir, "rejected-english.tsv"), "word\tstatus\tzipf\tbucket\treason\n" + rejectedRows.join("\n") + (rejectedRows.length ? "\n" : ""), "utf8"),
  writeFile(path.join(reviewDir, "needs-review.tsv"), format(rows.filter((item) => item.status === "review")), "utf8"),
  writeFile(path.join(reviewDir, "manual-decisions.tsv"), format(rows.filter((item) => item.status.startsWith("keep-"))), "utf8"),
]);

console.log(`Word review reports written to ${path.relative(process.cwd(), reviewDir)}.`);
console.log(`  rejected English: ${rejectedRows.length}`);
console.log(`  needs review: ${rows.filter((item) => item.status === "review").length}`);
