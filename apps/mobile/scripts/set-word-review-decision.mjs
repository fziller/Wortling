#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeWord } from "./pipeline/word-review.mjs";

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, value = ""] = arg.replace(/^--/, "").split("=");
  return [key, value];
}));
const word = normalizeWord(args.get("word"));
const decision = args.get("decision");
const note = args.get("note") ?? "";
if (!word || !["keep-target", "keep-allowed", "block"].includes(decision)) {
  throw new Error("Usage: yarn words:review:decide --word=need --decision=keep-target --note='Established German usage'.");
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const overridesPath = path.join(scriptDir, "data/word-review-overrides.tsv");
const source = await readFile(overridesPath, "utf8");
const lines = source.split("\n");
const header = lines.shift();
const entries = new Map();
for (const line of lines) {
  if (!line.trim() || line.startsWith("#")) continue;
  const [entryWord, entryDecision, entryNote = ""] = line.split("\t");
  entries.set(normalizeWord(entryWord), { decision: entryDecision, note: entryNote });
}
entries.set(word, { decision, note });
const body = [...entries.entries()]
  .sort(([left], [right]) => left.localeCompare(right, "de"))
  .map(([entryWord, entry]) => [entryWord, entry.decision, entry.note].join("\t"));
await writeFile(overridesPath, [header, ...body, ""].join("\n"), "utf8");
console.log(`Saved ${word}: ${decision} in ${path.relative(process.cwd(), overridesPath)}.`);
