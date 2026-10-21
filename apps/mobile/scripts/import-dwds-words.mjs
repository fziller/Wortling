import { createReadStream } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import path from "node:path";
import readline from "node:readline";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { classifyWord, isTargetApproved, loadEnglishWords, loadReviewOverrides } from "./pipeline/word-review.mjs";

const execFileAsync = promisify(execFile);

const DWDS_URL = "https://www.dwds.de/lemma/json";
const LT_ZIP_URL = "https://languagetool.org/download/LanguageTool-stable.zip";
const GERMAN_POS_JAR_URL = "https://repo.maven.apache.org/maven2/de/danielnaber/german-pos-dict/1.2.4/german-pos-dict-1.2.4.jar";
const DEFAULT_WORD_LENGTH = 5;
const DWDS_ALLOWED_POS = new Set(["Adjektiv", "Adverb", "Interjektion", "Substantiv", "Verb"]);
const BLOCKED_WORDS = new Set([
  // 4-letter abbreviations – keep gameplay clean, English loanwords like "hash" stay allowed
  "abcs", "abms", "adac", "akws", "asvg", "bdsg", "bmws", "bshg", "btmg", "bvwg",
  "cpus", "crms", "cvjm", "daad", "ddos", "egmr", "ehec", "ehnl", "ekgs",
  "fckw", "fdgo", "fsme", "gmbh", "gpus", "hdmi", "http", "isbn", "isdn", "issn",
  "jvas", "kfzs", "ldpd", "lgbt", "lkws", "mbit", "mpox", "mrna", "mvas", "nvas",
  "oecd", "oems", "öpnv", "pdfs", "pkws", "pvcs", "rfid", "scsi", "stpo", "stvo",
]);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frequencyTsvPath = path.resolve(scriptDir, "data/subtlex-de.tsv");
const wordConfigPath = path.resolve(scriptDir, "../src/games/wordConfig.ts");

// Load central config (single source of truth). Falls back to defaults if file missing.
async function loadWordConfig() {
  try {
    const raw = await import("node:fs/promises").then((m) => m.readFile(wordConfigPath, "utf8"));
    const easy = Number(raw.match(/easy:\s*([0-9.]+)/)?.[1] ?? 3.8);
    const medium = Number(raw.match(/medium:\s*([0-9.]+)/)?.[1] ?? 2.2);
    const hard = Number(raw.match(/hard:\s*([0-9.]+)/)?.[1] ?? 1.5);
    const thresholds = {};
    const block = raw.match(/WORD_THRESHOLDS_BY_LENGTH\s*=\s*\{([^}]+)\}/s)?.[1] ?? "";
    for (const m of block.matchAll(/(\d):\s*([0-9.]+)/g)) {
      thresholds[Number(m[1])] = Number(m[2]);
    }
    return {
      ZIPF_EASY_THRESHOLD: easy,
      ZIPF_MEDIUM_THRESHOLD: medium,
      ZIPF_HARD_THRESHOLD: hard,
      thresholdsByLength: thresholds,
    };
  } catch {
    return {
      ZIPF_EASY_THRESHOLD: 3.8,
      ZIPF_MEDIUM_THRESHOLD: 2.2,
      ZIPF_HARD_THRESHOLD: 1.5,
      thresholdsByLength: { 4: 1.5, 5: 2.2, 6: 2.2, 7: 2.2 },
    };
  }
}
const wordConfig = await loadWordConfig();
const ZIPF_EASY_THRESHOLD = wordConfig.ZIPF_EASY_THRESHOLD;
const ZIPF_MEDIUM_THRESHOLD = wordConfig.ZIPF_MEDIUM_THRESHOLD;
const ZIPF_HARD_THRESHOLD = wordConfig.ZIPF_HARD_THRESHOLD;
const WORD_THRESHOLDS_BY_LENGTH = wordConfig.thresholdsByLength;
const cacheDir = path.resolve(scriptDir, ".cache/word-import");
const ltZipPath = path.join(cacheDir, "LanguageTool-stable.zip");
const ltDir = path.join(cacheDir, "lt");
const ltJarPath = path.join(ltDir, "LanguageTool-6.6/languagetool.jar");
const germanPosJarPath = path.join(cacheDir, "german-pos-dict-1.2.4.jar");
const germanPosDir = path.join(cacheDir, "german-pos-dict");
const germanDictPath = path.join(germanPosDir, "org/languagetool/resource/de/german.dict");
const germanInfoPath = path.join(germanPosDir, "org/languagetool/resource/de/german.info");
const posDumpPath = path.join(cacheDir, "german-pos-dump.txt");
const englishFrequencyPath = path.join(cacheDir, "english-50k.txt");
const reviewOverridesPath = path.resolve(scriptDir, "data/word-review-overrides.tsv");
const reviewReportDir = path.resolve(scriptDir, "reports/word-review");
const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value = ""] = arg.replace(/^--/, "").split("=");
    return [key, value];
  })
);
const wordLength = Number(args.get("length") ?? DEFAULT_WORD_LENGTH);
const defaultOutputPath = path.resolve(scriptDir, "../src/games/between/generated/allowedGuesses.ts");
const outputPath = path.resolve(scriptDir, "..", args.get("output") ?? path.relative(path.resolve(scriptDir, ".."), defaultOutputPath));

if (!Number.isInteger(wordLength) || wordLength <= 0) {
  throw new Error("Usage: node scripts/import-dwds-words.mjs --length=6 --output=src/games/wortcode/generated/allowedGuesses.ts");
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function download(url, targetPath) {
  if (await exists(targetPath)) {
    return;
  }

  const response = await fetch(url);

  if (!response.ok || !response.body) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  await mkdir(path.dirname(targetPath), { recursive: true });
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(targetPath, bytes);
}

async function ensureLanguageTool() {
  await download(LT_ZIP_URL, ltZipPath);

  if (!(await exists(ltJarPath))) {
    await mkdir(ltDir, { recursive: true });
    await execFileAsync("unzip", ["-q", "-o", ltZipPath, "-d", ltDir]);
  }
}

async function ensureGermanPosDump() {
  await download(GERMAN_POS_JAR_URL, germanPosJarPath);

  if (!(await exists(germanDictPath)) || !(await exists(germanInfoPath))) {
    await mkdir(germanPosDir, { recursive: true });
    await execFileAsync("unzip", ["-q", "-o", germanPosJarPath, "-d", germanPosDir]);
  }

  if (!(await exists(posDumpPath))) {
    await execFileAsync("java", [
      "-cp",
      ltJarPath,
      "org.languagetool.tools.DictionaryExporter",
      "-i",
      germanDictPath,
      "-info",
      germanInfoPath,
      "-o",
      posDumpPath
    ], { maxBuffer: 1024 * 1024 * 20 });
  }
}

function normalizeWord(word) {
  return String(word ?? "")
    .normalize("NFC")
    .trim()
    .toLocaleLowerCase("de-DE")
    .replace(/ß/g, "ss");
}

function hasValidShape(word) {
  return Array.from(word).length === wordLength && /^[a-zäöü]+$/u.test(word) && !BLOCKED_WORDS.has(word);
}

function isAllowedDwdsEntry(entry) {
  const word = normalizeWord(entry.lemma);

  return DWDS_ALLOWED_POS.has(entry.pos) && hasValidShape(word);
}

function isAllowedPosTag(form, lemma, tag) {
  if (tag.startsWith("SUB:")) {
    // Keep all SUB forms (including GEN) in allowedGuesses so Wortleiter graph stays connected;
    // genitive will be bucketed separately and never picked as target (all presets).
    return true;
  }

  if (tag.startsWith("VER:")) {
    // Allow all verb forms so we can bucket them (base INF, finite PRÄ/PRT, hard PA/KJ/IMP).
    // ADJ: we allow all so hart can include deklinierte Formen.
    return tag.includes(":INF") || tag.includes(":PRÄ:") || tag.includes(":PRT:") || tag.includes(":PA") || tag.includes(":KJ") || tag.includes(":IMP");
  }

  if (tag.startsWith("ADJ:")) {
    // Allow all adjective forms so we can bucket base (PRD, lemma==form) vs flex (dekliniert/komparativ)
    return true;
  }

  return false;
}

function classifyBucket(word, tags) {
  if (!tags || tags.size === 0) return "base"; // DWDS lemma or unknown -> base
  let hasGenitive = false;
  let hasPlural = false;
  let hasVerbFinite = false;
  let hasPartizip = false;
  let hasKonjunktiv = false;
  let hasImperativ = false;
  let hasHardAdj = false;
  let hasSubSingular = false;
  let hasVerbInf = false;
  let hasAdjPrd = false;
  for (const tag of tags) {
    if (tag === "DWDS:BASE") {
      hasSubSingular = true; // treat DWDS as base
      continue;
    }
    if (tag.includes(":GEN")) hasGenitive = true;
    if (tag.startsWith("SUB:") && tag.includes(":PLU")) hasPlural = true;
    if (tag.startsWith("SUB:") && tag.includes(":SIN")) hasSubSingular = true;
    if (tag.startsWith("VER:") && (tag.includes(":PRÄ:") || tag.includes(":PRT:")) && !tag.includes(":KJ") && !tag.includes(":IMP") && !tag.includes(":PA")) hasVerbFinite = true;
    if (tag.startsWith("VER:") && tag.includes(":INF")) hasVerbInf = true;
    if (tag.startsWith("VER:") && tag.includes(":PA")) hasPartizip = true;
    if (tag.startsWith("VER:") && tag.includes(":KJ")) hasKonjunktiv = true;
    if (tag.startsWith("VER:") && tag.includes(":IMP")) hasImperativ = true;
    if (tag.startsWith("ADJ:") && tag.startsWith("ADJ:PRD")) hasAdjPrd = true;
    if (tag.startsWith("ADJ:") && !tag.startsWith("ADJ:PRD")) hasHardAdj = true;
  }
  if (hasGenitive) return "genitive";
  if (hasPartizip) return "partizip";
  if (hasKonjunktiv) return "konjunktiv";
  if (hasImperativ) return "imperativ";
  if (hasPlural) return "plural";
  if (hasVerbFinite) return "verb-finite";
  if (hasHardAdj) return "adj-flex";
  if (hasSubSingular || hasVerbInf || hasAdjPrd) return "base";
  if (hasVerbInf) return "base";
  return "base";
}

function isProperNameOnly(tags) {
  const dictionaryTags = [...tags].filter((tag) => tag !== "DWDS:BASE");
  return dictionaryTags.length > 0 && dictionaryTags.every((tag) => tag.startsWith("EIG:"));
}

function getTier(zipf) {
  if (zipf >= ZIPF_EASY_THRESHOLD) return "easy";
  if (zipf >= ZIPF_MEDIUM_THRESHOLD) return "medium";
  if (zipf >= ZIPF_HARD_THRESHOLD) return "hard";
  return "unknown";
}

async function loadZipfData() {
  const zipfMap = new Map();
  const rankMap = new Map();
  if (!(await exists(frequencyTsvPath))) {
    console.warn(`Frequency data not found at ${frequencyTsvPath}, all words will be treated as unknown.`);
    return { zipfMap, rankMap };
  }
  const content = await import("node:fs/promises").then((m) => m.readFile(frequencyTsvPath, "utf8"));
  for (const [index, line] of content.split("\n").entries()) {
    if (!line || line.startsWith("word\t")) continue;
    const [word, zipfStr] = line.split("\t");
    const zipf = Number(zipfStr);
    if (word && Number.isFinite(zipf)) {
      const normalized = normalizeWord(word);
      zipfMap.set(normalized, zipf);
      if (!rankMap.has(normalized)) rankMap.set(normalized, index);
    }
  }
  return { zipfMap, rankMap };
}

async function addDwdsWords(words, wordTags) {
  const response = await fetch(DWDS_URL);

  if (!response.ok) {
    throw new Error(`Failed to download DWDS lemma data: ${response.status} ${response.statusText}`);
  }

  const entries = await response.json();

  for (const entry of entries) {
    if (isAllowedDwdsEntry(entry)) {
      const w = normalizeWord(entry.lemma);
      words.add(w);
      if (!wordTags.has(w)) wordTags.set(w, new Set());
      // DWDS lemmas are base forms
      wordTags.get(w).add("DWDS:BASE");
    }
  }
}

async function addMorphologyWords(words, wordTags) {
  const lines = readline.createInterface({ input: createReadStream(posDumpPath, "utf8"), crlfDelay: Infinity });

  for await (const line of lines) {
    const [form, lemma, tag] = line.split("\t");
    const word = normalizeWord(form);

    if (!hasValidShape(word)) continue;

    if (tag.startsWith("EIG:")) {
      if (!wordTags.has(word)) wordTags.set(word, new Set());
      wordTags.get(word).add(tag);
      continue;
    }

    if (isAllowedPosTag(form, lemma, tag)) {
      words.add(word);
      if (!wordTags.has(word)) wordTags.set(word, new Set());
      wordTags.get(word).add(tag);
    }
  }
}

await mkdir(cacheDir, { recursive: true });
await ensureLanguageTool();
await ensureGermanPosDump();

const words = new Set();
const wordTags = new Map(); // word -> Set<tag>
await addDwdsWords(words, wordTags);
await addMorphologyWords(words, wordTags);

// DWDS can label proper names as generic nouns. Prefer the morphology tags when
// available: words tagged exclusively as EIG (Eigenname) are never gameplay words.
for (const [word, tags] of wordTags) {
  if (isProperNameOnly(tags)) words.delete(word);
}

const smokeTestsByLength = {
  5: {
    included: ["panne", "pfote", "hunde", "türen", "sagte", "läuft", "klein", "gutem"],
    excluded: []
  },
  6: {
    included: ["banane", "fragen", "laufen"],
    excluded: []
  },
  7: {
    included: ["abstand", "antwort", "fenster"],
    excluded: []
  }
};
const smokeTests = smokeTestsByLength[wordLength];

if (smokeTests) {
  for (const expected of smokeTests.included) {
    if (!words.has(expected)) {
      throw new Error(`Generated word list is missing expected smoke-test word: ${expected}.`);
    }
  }

  for (const blocked of smokeTests.excluded) {
    if (words.has(blocked)) {
      throw new Error(`Generated word list unexpectedly includes smoke-test word: ${blocked}.`);
    }
  }
}

const collator = new Intl.Collator("de-DE", { sensitivity: "base" });
const initialSortedWords = Array.from(words).sort(collator.compare);

// Build tiered targets from frequency data (SUBTLEX-DE via FrequencyWords) + morphology buckets.
// "Better have than need": store zipf/tier/bucket for all words. Genitive already dropped in isAllowedPosTag.
const { zipfMap, rankMap } = await loadZipfData();
const [englishWords, reviewOverrides] = await Promise.all([
  loadEnglishWords(englishFrequencyPath),
  loadReviewOverrides(reviewOverridesPath),
]);
const reviewedWordMeta = initialSortedWords.map((word) => {
  const zipf = zipfMap.get(word) ?? 1.0;
  const tags = wordTags.get(word) ?? new Set();
  const bucket = classifyBucket(word, tags);
  const roundedZipf = Math.round(zipf * 100) / 100;
  const review = classifyWord({ word, zipf: roundedZipf, germanRank: rankMap.get(word), englishWords, overrides: reviewOverrides });
  return { word, zipf: roundedZipf, germanRank: rankMap.get(word) ?? null, tier: getTier(zipf), bucket, review };
});
const allowedReviewedWordMeta = reviewedWordMeta.filter((item) => item.review.status !== "blocked");
const wordMeta = allowedReviewedWordMeta.map(({ word, zipf, tier, bucket }) => ({ word, zipf, tier, bucket }));
const sortedWords = wordMeta.map((item) => item.word);
const rejectedEnglish = reviewedWordMeta.filter((item) => item.review.status === "blocked" && englishWords.has(item.word));
const classicThreshold = WORD_THRESHOLDS_BY_LENGTH[wordLength] ?? ZIPF_MEDIUM_THRESHOLD;
const hartThreshold = Math.min(classicThreshold, ZIPF_HARD_THRESHOLD);
const isBaseEligible = (m) => isTargetApproved(m.review) && m.bucket === "base" && m.zipf >= classicThreshold;
const isErweitertEligible = (m) => isTargetApproved(m.review) && (m.bucket === "base" || m.bucket === "plural" || m.bucket === "verb-finite") && m.zipf >= classicThreshold;
const isHartEligible = (m) => isTargetApproved(m.review) && m.bucket !== "genitive" && m.zipf >= hartThreshold; // hart = all non-genitive buckets but at least hart/classic lower
// classic = base only (klassisch), erweitert = base+plural+verb-finite, hart = all (genitive already excluded)
const targetWords = allowedReviewedWordMeta.filter(isBaseEligible).map((m) => m.word);
const erweitertWords = allowedReviewedWordMeta.filter(isErweitertEligible).map((m) => m.word);
const hartWords = allowedReviewedWordMeta.filter(isHartEligible).map((m) => m.word);
const hardWords = allowedReviewedWordMeta.filter((m) => m.zipf >= ZIPF_HARD_THRESHOLD && m.zipf < ZIPF_MEDIUM_THRESHOLD).map((m) => m.word);
const easyWords = allowedReviewedWordMeta.filter((m) => m.tier === "easy").map((m) => m.word);
const mediumWords = allowedReviewedWordMeta.filter((m) => m.tier === "medium").map((m) => m.word);

await mkdir(path.dirname(outputPath), { recursive: true });
await mkdir(reviewReportDir, { recursive: true });
await writeFile(
  path.join(reviewReportDir, `rejected-english-${wordLength}.tsv`),
  "word\tstatus\tzipf\tbucket\treason\n" + rejectedEnglish
    .map((item) => [item.word, item.review.status, item.zipf, item.bucket, item.review.reason].join("\t"))
    .join("\n") + "\n",
  "utf8",
);
await writeFile(
  outputPath,
  `// Generated by scripts/import-dwds-words.mjs. Do not edit by hand.\n` +
    `// Sources: DWDS Lemma Database (${DWDS_URL}), German POS Dictionary (${GERMAN_POS_JAR_URL}), and reviewed English-frequency exclusions.\n` +
    `// License: CC BY-SA 4.0. Filtered and modified for ${wordLength}-letter gameplay guesses.\n` +
    `export const generatedAllowedGuesses = ${JSON.stringify(sortedWords, null, 2)} as const;\n`,
  "utf8"
);

// Also emit tiered files alongside the allowed guesses (same directory, different names).
const dir = path.dirname(outputPath);
const baseName = path.basename(outputPath);
// Keep shared/7-letter naming compatible: "allowedGuesses7.ts" -> "targetWords7.ts" etc. For normal paths use "targetWords.ts"
const isSharedSeven = outputPath.includes("shared/generated");
const targetFileName = isSharedSeven ? "targetWords7.ts" : "targetWords.ts";
const metaFileName = isSharedSeven ? "wordMeta7.ts" : "wordMeta.ts";

const targetPath = path.join(dir, targetFileName);
const metaPath = path.join(dir, metaFileName);

await writeFile(
  targetPath,
  `// Generated by scripts/import-dwds-words.mjs. Do not edit by hand.\n` +
    `// Tier thresholds: easy ≥${ZIPF_EASY_THRESHOLD}, medium ≥${ZIPF_MEDIUM_THRESHOLD} (classic = easy+medium ∩ base, per-length threshold ${classicThreshold} for ${wordLength}), hard ≥${ZIPF_HARD_THRESHOLD}. Target words must pass the English-word review policy.\n` +
    `// Buckets: base (klassisch), plural + verb-finite (erweitert), all (hart). Genitive dropped completely.\n` +
    `// Source: SUBTLEX-DE approximation via FrequencyWords de_50k (FrequencyWords + SUBTLEX Zipf per billion) at ${path.relative(path.resolve(scriptDir, ".."), frequencyTsvPath)}.\n` +
    `export const generatedTargetWords = ${JSON.stringify(targetWords, null, 2)} as const;\n`,
  "utf8"
);

// Also emit bucket-specific files for erweitert/hart presets (same dir).
const erweitertPath = path.join(dir, isSharedSeven ? "erweitertWords7.ts" : "erweitertWords.ts");
const hartPath = path.join(dir, isSharedSeven ? "hartWords7.ts" : "hartWords.ts");
await writeFile(
  erweitertPath,
  `// Generated by scripts/import-dwds-words.mjs. Do not edit by hand.\n` +
    `// Erweitert = base + plural + verb-finite ∩ Zipf≥${classicThreshold} (per-length for ${wordLength}).\n` +
    `export const generatedErweitertWords = ${JSON.stringify(erweitertWords, null, 2)} as const;\n`,
  "utf8"
);
await writeFile(
  hartPath,
  `// Generated by scripts/import-dwds-words.mjs. Do not edit by hand.\n` +
    `// Hart = all buckets ∩ Zipf≥${ZIPF_HARD_THRESHOLD} (genitive excluded).\n` +
    `export const generatedHartWords = ${JSON.stringify(hartWords, null, 2)} as const;\n`,
  "utf8"
);

await writeFile(
  metaPath,
  `// Generated by scripts/import-dwds-words.mjs. Do not edit by hand.\n` +
    `// Zipf = log10(freq per billion) from FrequencyWords de_50k (total 151M tokens). Tier thresholds: easy ≥${ZIPF_EASY_THRESHOLD}, medium ≥${ZIPF_MEDIUM_THRESHOLD}, hard ≥${ZIPF_HARD_THRESHOLD}.\n` +
    `// Bucket: base (klassisch), plural, verb-finite (erweitert), other hard. Genitive dropped. Contains zipf/tier/bucket for every allowed guess.\n` +
    `export const generatedWordMeta = ${JSON.stringify(wordMeta, null, 2)} as const;\n`,
  "utf8"
);

console.log(`Generated ${sortedWords.length} ${wordLength}-letter guesses at ${path.relative(process.cwd(), outputPath)}.`);
console.log(`  -> classic ${targetWords.length} (base ∩ ≥${classicThreshold} for ${wordLength}): ${easyWords.length} easy total, ${mediumWords.length} medium total; erweitert ${erweitertWords.length}, hart ${hartWords.length} (≥${hartThreshold}), unknown ${sortedWords.length - hartWords.length}`);
console.log(`  -> wrote ${path.relative(process.cwd(), targetPath)}, ${path.relative(process.cwd(), erweitertPath)}, ${path.relative(process.cwd(), hartPath)}, ${path.relative(process.cwd(), metaPath)}`);
