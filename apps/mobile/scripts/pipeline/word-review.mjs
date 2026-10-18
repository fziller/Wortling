import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export const ENGLISH_FREQUENCY_URL = "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt";
export const REJECT_AMBIGUOUS_ENGLISH_WORDS = true;

export function normalizeWord(word) {
  return String(word ?? "")
    .normalize("NFC")
    .trim()
    .toLocaleLowerCase("de-DE")
    .replace(/ß/g, "ss");
}

export async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureEnglishFrequencyList(cachePath) {
  if (await exists(cachePath)) return;

  const response = await fetch(ENGLISH_FREQUENCY_URL);
  if (!response.ok) throw new Error(`Failed to download English frequency data: ${response.status} ${response.statusText}`);

  await mkdir(path.dirname(cachePath), { recursive: true });
  await writeFile(cachePath, await response.text(), "utf8");
}

export async function loadEnglishWords(cachePath) {
  await ensureEnglishFrequencyList(cachePath);
  const words = new Map();
  const lines = (await readFile(cachePath, "utf8")).split("\n");
  for (const [index, line] of lines.entries()) {
    const [rawWord] = line.trim().split(/\s+/, 1);
    const word = normalizeWord(rawWord);
    if (/^[a-z]+$/.test(word) && !words.has(word)) words.set(word, index + 1);
  }
  return words;
}

export async function loadReviewOverrides(filePath) {
  const decisions = new Map();
  if (!(await exists(filePath))) return decisions;

  const lines = (await readFile(filePath, "utf8")).split("\n");
  for (const [index, line] of lines.entries()) {
    if (!line.trim() || line.startsWith("#") || (index === 0 && line.startsWith("word\t"))) continue;
    const [rawWord, decision, note = ""] = line.split("\t");
    const word = normalizeWord(rawWord);
    if (!word || !["keep-target", "keep-allowed", "block"].includes(decision)) {
      throw new Error(`Invalid word-review override at ${filePath}:${index + 1}. Expected word<TAB>keep-target|keep-allowed|block<TAB>note.`);
    }
    decisions.set(word, { decision, note });
  }
  return decisions;
}

export function classifyWord({ word, zipf, germanRank, englishWords, overrides }) {
  const override = overrides.get(word)?.decision ?? null;
  if (override === "block") return { status: "blocked", reason: "manual block" };
  if (override === "keep-target") return { status: "keep-target", reason: "manual keep-target" };
  if (override === "keep-allowed") return { status: "keep-allowed", reason: "manual keep-allowed" };

  const englishRank = englishWords.get(word);
  if (!englishRank) return { status: "approved", reason: "no English frequency-list match" };
  if (zipf <= 1 || !germanRank) return { status: "blocked", reason: "English frequency-list match without SUBTLEX-DE frequency" };

  const EnglishDominance = germanRank / englishRank;
  if (EnglishDominance >= 30) return { status: "blocked", reason: `English frequency dominates German usage (${EnglishDominance.toFixed(1)}× rank ratio)` };
  if (EnglishDominance >= 8 && REJECT_AMBIGUOUS_ENGLISH_WORDS) return { status: "blocked", reason: `English frequency substantially exceeds German usage (${EnglishDominance.toFixed(1)}× rank ratio)` };
  if (EnglishDominance >= 8) return { status: "review", reason: `English frequency substantially exceeds German usage (${EnglishDominance.toFixed(1)}× rank ratio)` };
  return { status: "approved", reason: "German frequency is comparable to English usage" };
}

export function isTargetApproved(classification) {
  return classification.status === "approved" || classification.status === "keep-target";
}
