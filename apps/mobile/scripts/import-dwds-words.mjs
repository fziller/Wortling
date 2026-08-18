import { createReadStream } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import path from "node:path";
import readline from "node:readline";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);

const DWDS_URL = "https://www.dwds.de/lemma/json";
const LT_ZIP_URL = "https://languagetool.org/download/LanguageTool-stable.zip";
const GERMAN_POS_JAR_URL = "https://repo.maven.apache.org/maven2/de/danielnaber/german-pos-dict/1.2.4/german-pos-dict-1.2.4.jar";
const WORD_LENGTH = 5;
const DWDS_ALLOWED_POS = new Set(["Adjektiv", "Adverb", "Interjektion", "Substantiv", "Verb"]);
const BLOCKED_WORDS = new Set([]);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const cacheDir = path.resolve(scriptDir, ".cache/word-import");
const ltZipPath = path.join(cacheDir, "LanguageTool-stable.zip");
const ltDir = path.join(cacheDir, "lt");
const ltJarPath = path.join(ltDir, "LanguageTool-6.6/languagetool.jar");
const germanPosJarPath = path.join(cacheDir, "german-pos-dict-1.2.4.jar");
const germanPosDir = path.join(cacheDir, "german-pos-dict");
const germanDictPath = path.join(germanPosDir, "org/languagetool/resource/de/german.dict");
const germanInfoPath = path.join(germanPosDir, "org/languagetool/resource/de/german.info");
const posDumpPath = path.join(cacheDir, "german-pos-dump.txt");
const outputPath = path.resolve(scriptDir, "../src/games/between/generated/allowedGuesses.ts");

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
    .toLocaleLowerCase("de-DE");
}

function hasValidShape(word) {
  return Array.from(word).length === WORD_LENGTH && /^[a-zäöüß]+$/u.test(word) && !BLOCKED_WORDS.has(word);
}

function isAllowedDwdsEntry(entry) {
  const word = normalizeWord(entry.lemma);

  return DWDS_ALLOWED_POS.has(entry.pos) && hasValidShape(word);
}

function isAllowedPosTag(form, lemma, tag) {
  if (tag.startsWith("SUB:")) {
    return true;
  }

  if (tag.startsWith("VER:")) {
    return (
      (tag.includes(":INF") || tag.includes(":PRÄ:") || tag.includes(":PRT:")) &&
      !tag.includes(":KJ") &&
      !tag.includes(":IMP") &&
      !tag.includes(":PA")
    );
  }

  if (tag.startsWith("ADJ:")) {
    return normalizeWord(form) === normalizeWord(lemma) && tag.startsWith("ADJ:PRD");
  }

  return false;
}

async function addDwdsWords(words) {
  const response = await fetch(DWDS_URL);

  if (!response.ok) {
    throw new Error(`Failed to download DWDS lemma data: ${response.status} ${response.statusText}`);
  }

  const entries = await response.json();

  for (const entry of entries) {
    if (isAllowedDwdsEntry(entry)) {
      words.add(normalizeWord(entry.lemma));
    }
  }
}

async function addMorphologyWords(words) {
  const lines = readline.createInterface({ input: createReadStream(posDumpPath, "utf8"), crlfDelay: Infinity });

  for await (const line of lines) {
    const [form, lemma, tag] = line.split("\t");
    const word = normalizeWord(form);

    if (hasValidShape(word) && isAllowedPosTag(form, lemma, tag)) {
      words.add(word);
    }
  }
}

await mkdir(cacheDir, { recursive: true });
await ensureLanguageTool();
await ensureGermanPosDump();

const words = new Set();
await addDwdsWords(words);
await addMorphologyWords(words);

for (const expected of ["panne", "pfote", "hunde", "türen", "sagte", "läuft", "klein"]) {
  if (!words.has(expected)) {
    throw new Error(`Generated word list is missing expected smoke-test word: ${expected}.`);
  }
}

if (words.has("gutem")) {
  throw new Error("Generated word list unexpectedly includes declined adjective smoke-test word: gutem.");
}

const collator = new Intl.Collator("de-DE", { sensitivity: "base" });
const sortedWords = Array.from(words).sort(collator.compare);

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `// Generated by scripts/import-dwds-words.mjs. Do not edit by hand.\n` +
    `// Sources: DWDS Lemma Database (${DWDS_URL}) and German POS Dictionary (${GERMAN_POS_JAR_URL}).\n` +
    `// License: CC BY-SA 4.0. Filtered and modified for ${WORD_LENGTH}-letter gameplay guesses.\n` +
    `export const generatedAllowedGuesses = ${JSON.stringify(sortedWords, null, 2)} as const;\n`,
  "utf8"
);

console.log(`Generated ${sortedWords.length} ${WORD_LENGTH}-letter guesses at ${path.relative(process.cwd(), outputPath)}.`);
