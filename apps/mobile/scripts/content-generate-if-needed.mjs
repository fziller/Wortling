#!/usr/bin/env node
// ponytail: naive mtime check — skips DWDS import if generated files newer than scripts + wordlists
import { existsSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

const projectRoot = join(import.meta.dirname, "..");
const markers = [
  "scripts/import-dwds-words.mjs",
  "scripts/import-bio-words.mjs",
  "scripts/pipeline/shared.mjs",
  "scripts/sources/bio.mjs",
  "scripts/data/bio.tsv",
  "scripts/generate-wortleiter-puzzles.mjs",
  "src/games/wortleiter/targetWords.ts",
];
const outputs = [
  "src/games/wortleiter/generated/allowedGuesses.ts",
  "src/games/between/generated/allowedGuesses.ts",
  "src/games/wortcode/generated/allowedGuesses.ts",
  "src/games/shared/generated/allowedGuesses7.ts",
  "src/games/packs/bio/generated/bioTargets.ts",
  "src/games/wortleiter/generated/puzzles.ts",
];

const newestInput = Math.max(...markers.map((p) => {
  try { return statSync(join(projectRoot, p)).mtimeMs; } catch { return 0; }
}));
const oldestOutput = Math.min(...outputs.map((p) => {
  try { return statSync(join(projectRoot, p)).mtimeMs; } catch { return 0; }
}));
const allExist = outputs.every((p) => existsSync(join(projectRoot, p)));

if (allExist && oldestOutput > newestInput) {
  console.log("content:generate skipped — generated files up to date");
  process.exit(0);
}
console.log("content:generate running — outputs stale or missing");
execSync("yarn content:generate", { stdio: "inherit", cwd: projectRoot });
