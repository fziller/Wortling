// Bio package source adapters.
// 1) Curated TSV: scripts/data/bio.tsv (manual, always available)
// 2) Wikidata SPARQL (optional, cached) — best-effort, never fails the build.

import { readFile, stat, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeWord, hasValidShape } from "../pipeline/shared.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const bioTsvPath = path.resolve(scriptDir, "../data/bio.tsv");
const cacheDir = path.resolve(scriptDir, "../.cache/word-import");
const wikidataCachePath = path.join(cacheDir, "wikidata-bio.json");

const WIKIDATA_SPARQL = "https://query.wikidata.org/sparql";
const WIKIDATA_QUERY = `
SELECT DISTINCT ?label WHERE {
  { ?item wdt:P31/wdt:P279* wd:Q16521 } UNION
  { ?item wdt:P31/wdt:P279* wd:Q4936952 } UNION
  { ?item wdt:P31/wdt:P279* wd:Q12136 }
  ?item rdfs:label ?label FILTER(LANG(?label) = "de")
  FILTER(!REGEX(?label, " "))
  FILTER(STRLEN(?label) >= 4 && STRLEN(?label) <= 7)
}
LIMIT 5000
`;

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

async function fetchWikidataLabels() {
  // Best-effort: timeout 15s, cache forever, never throw
  try {
    if (await exists(wikidataCachePath)) {
      const raw = await readFile(wikidataCachePath, "utf8");
      return JSON.parse(raw);
    }
    const url = `${WIKIDATA_SPARQL}?query=${encodeURIComponent(WIKIDATA_QUERY)}&format=json`;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, { headers: { Accept: "application/sparql-results+json", "User-Agent": "Wortkniff/1.0" }, signal: controller.signal });
    clearTimeout(t);
    if (!res.ok) return [];
    const json = await res.json();
    const labels = [...new Set(json.results.bindings.map((b) => b.label?.value).filter(Boolean))];
    await mkdir(path.dirname(wikidataCachePath), { recursive: true });
    await writeFile(wikidataCachePath, JSON.stringify(labels, null, 2), "utf8");
    return labels;
  } catch {
    return [];
  }
}

export async function fetchBioWords(wordLength) {
  const result = [];
  const seen = new Set();

  // 1) Curated TSV — source of truth, always wins
  if (await exists(bioTsvPath)) {
    const raw = await readFile(bioTsvPath, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const word = normalizeWord(trimmed.split("\t")[0].split(",")[0]);
      if (hasValidShape(word, wordLength) && !seen.has(word)) {
        seen.add(word);
        result.push({ form: word, lemma: word, tag: "BIO:BASE", sourceId: "bio-tsv" });
      }
    }
  }

  // 2) Wikidata (optional enrichment, deduplicated) — disabled for MVP (curated TSV only).
  // Enable when query is curated: uncomment below and set WIKIDATA_BIO=1
  if (process.env.WIKIDATA_BIO === "1") {
    const wikidataLabels = await fetchWikidataLabels();
    for (const raw of wikidataLabels) {
      const word = normalizeWord(raw);
      if (!hasValidShape(word, wordLength) || seen.has(word)) continue;
      seen.add(word);
      result.push({ form: word, lemma: raw, tag: "BIO:BASE", sourceId: "wikidata-bio" });
    }
  }

  return result;
}
