#!/usr/bin/env node
// Generates docs/word-stats.md — quick glance of word counts per category/difficulty.
// Reads generated core + bio files, no network.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, "..");
const repoDocsDir = path.resolve(appDir, "../..", "docs");
const outPath = path.join(repoDocsDir, "word-stats.md");

function parseGeneratedArray(fileText) {
  const m = fileText.match(/\[([\s\S]*?)\] as const/);
  if (!m) return [];
  try { return JSON.parse(`[${m[1]}]`); } catch { return []; }
}

function parseWordMeta(fileText) {
  const m = fileText.match(/export const generatedWordMeta = (\[[\s\S]*?\]) as const/);
  if (!m) return [];
  try { return JSON.parse(m[1]); } catch { return []; }
}

async function readJsonArray(rel) {
  try { const t = await readFile(path.join(appDir, rel), "utf8"); return parseGeneratedArray(t); } catch { return []; }
}
async function readMeta(rel) {
  try { const t = await readFile(path.join(appDir, rel), "utf8"); return parseWordMeta(t); } catch { return []; }
}

const lengths = [4, 5, 6, 7];
const coreFiles = {
  4: { allowed: "src/games/wortleiter/generated/allowedGuesses.ts", target: "src/games/wortleiter/generated/targetWords.ts", erweitert: "src/games/wortleiter/generated/erweitertWords.ts", hart: "src/games/wortleiter/generated/hartWords.ts", meta: "src/games/wortleiter/generated/wordMeta.ts" },
  5: { allowed: "src/games/between/generated/allowedGuesses.ts", target: "src/games/between/generated/targetWords.ts", erweitert: "src/games/between/generated/erweitertWords.ts", hart: "src/games/between/generated/hartWords.ts", meta: "src/games/between/generated/wordMeta.ts" },
  6: { allowed: "src/games/wortcode/generated/allowedGuesses.ts", target: "src/games/wortcode/generated/targetWords.ts", erweitert: "src/games/wortcode/generated/erweitertWords.ts", hart: "src/games/wortcode/generated/hartWords.ts", meta: "src/games/wortcode/generated/wordMeta.ts" },
  7: { allowed: "src/games/shared/generated/allowedGuesses7.ts", target: "src/games/shared/generated/targetWords7.ts", erweitert: "src/games/shared/generated/erweitertWords7.ts", hart: "src/games/shared/generated/hartWords7.ts", meta: "src/games/shared/generated/wordMeta7.ts" },
};

const bioPath = "src/games/packs/bio/generated/bioTargets.ts";
let bioByLength = { 4: [], 5: [], 6: [], 7: [] };
try {
  const t = await readFile(path.join(appDir, bioPath), "utf8");
  const m = t.match(/bioTargetWordsByLength = (\{[\s\S]*?\}) as const/);
  if (m) bioByLength = JSON.parse(m[1]);
} catch {}

const rows = [];
for (const len of lengths) {
  const f = coreFiles[len];
  const allowed = await readJsonArray(f.allowed);
  const target = await readJsonArray(f.target);
  const erweitert = await readJsonArray(f.erweitert);
  const hart = await readJsonArray(f.hart);
  const meta = await readMeta(f.meta);
  const tier = { easy: 0, medium: 0, hard: 0, unknown: 0 };
  const bucket = {};
  for (const m of meta) {
    tier[m.tier] = (tier[m.tier] ?? 0) + 1;
    bucket[m.bucket] = (bucket[m.bucket] ?? 0) + 1;
  }
  const bio = bioByLength[len] ?? [];
  rows.push({ len, allowed: allowed.length, target: target.length, erweitert: erweitert.length, hart: hart.length, tier, bucket, bio: bio.length });
}

const totalAllowed = rows.reduce((s, r) => s + r.allowed, 0);
const totalTarget = rows.reduce((s, r) => s + r.target, 0);
const totalBio = rows.reduce((s, r) => s + r.bio, 0);

const now = new Date().toISOString().slice(0, 10);

let md = `# Wort-Statistik

> Auto-generated — \`yarn words:stats\` (oder \`yarn content:generate\` regeneriert Bio + Core). Quelle: \`src/games/**/generated/*.ts\` + \`src/games/packs/bio/generated/bioTargets.ts\`.
> Letztes Update: ${now} · Core via DWDS + LanguageTool POS + SUBTLEX-DE Zipf, Bio ohne Zipf (alle validen Shapes).

## Überblick

| Kategorie | Wörter | Hinweis |
|---|---|---|
| Core allowed (alle ratebaren, 4–7) | ${totalAllowed} | \`allowedGuesses\` — immer vollständig, auch Bio ist hier drin (Union) |
| Core klassisch Targets (Zipf ≥ Threshold, base only) | ${totalTarget} | \`targetWords\` — was ohne Pack als Lösung kommt |
| Bio Targets (4–7, ohne Zipf) | ${totalBio} | \`bioTargetWordsByLength\` — nur wenn Pack aktiviert |

* \`allowedGuesses\` enthält **immer** Core ∪ Bio (auch wenn Bio in Settings aus) — nur Targets sind gated. Siehe \`src/games/packs/allowed.ts\`.*

## Core pro Länge & Schwierigkeit

| Länge | allowed | klassisch | erweitert | hart | easy | medium | hard | unknown |
|---|---|---|---|---|---|---|---|\n`;
for (const r of rows) {
  md += `| ${r.len} | ${r.allowed} | ${r.target} | ${r.erweitert} | ${r.hart} | ${r.tier.easy ?? 0} | ${r.tier.medium ?? 0} | ${r.tier.hard ?? 0} | ${r.tier.unknown ?? 0} |\n`;
}
md += `\n* Thresholds: 4→1.0, 5–7→2.2 (\`wordConfig.ts:WORD_THRESHOLDS_BY_LENGTH\`), Tiers: easy ≥3.8, medium ≥2.2, hard ≥1.5. \`klassisch=base∩≥thr\`, \`erweitert=base+plural+verb-finite∩≥thr\`, \`hart=alle∖genitive∩≥1.5\`.*
\n`;

md += `### Buckets pro Länge (aus wordMeta)\n\n| Länge | base | plural | verb-finite | partizip | konjunktiv | imperativ | adj-flex | genitive |\n|---|---|---|---|---|---|---|---|---|\n`;
for (const r of rows) {
  const b = r.bucket;
  md += `| ${r.len} | ${b.base ?? 0} | ${b.plural ?? 0} | ${b["verb-finite"] ?? 0} | ${b.partizip ?? 0} | ${b.konjunktiv ?? 0} | ${b.imperativ ?? 0} | ${b["adj-flex"] ?? 0} | ${b.genitive ?? 0} |\n`;
}
md += `\n* Genitive nie Target, aber in allowed für Wortleiter-Graph. *\n\n`;

md += `## Bio-Paket (ohne Zipf)\n\n| Länge | Bio Targets | Anteil an Core klassisch | Beispiele |\n|---|---|---|---|\n`;
for (const r of rows) {
  const share = r.target ? ((r.bio / r.target) * 100).toFixed(1) : "—";
  const sample = (bioByLength[r.len] ?? []).slice(0, 5).join(", ");
  md += `| ${r.len} | ${r.bio} | ${share}% | ${sample} |\n`;
}
md += `\n* Bio: \`scripts/data/bio.tsv\` + optional Wikidata (\`WIKIDATA_BIO=1\`) → \`scripts/import-bio-words.mjs\`. Kein Zipf-Filter, alle Shapes \`a-zäöü{4,7}\` ∩ !genitive sind Targets. Frequenz in App: \`normal\`=merge uniform (~${totalBio ? Math.round(totalBio/(totalTarget+totalBio)*100) : 0}% Bio), \`haeufig\`=70% Bio / 30% Core (deterministisch, siehe \`src/games/packs/selection.ts\`). Gilt für alle Spiele 4–7; Galgenwort 4–10 gefiltert.\n\n`;

md += `## Packs & Freischaltung\n\n- Pack \`bio\` ist Premium-gated via \`src/premium/packsAccess.ts\` (\`isPackGated()\` + \`hasPremiumAccess()\`). Settings rendert Toggle nur wenn nicht gegated oder Premium vorhanden, sonst Paywall-CTA. So kann später ein Flag / Paywall alles verstecken ohne Game-Logik zu ändern.\n- \`allowedGuesses\` bleibt immer Union (kein Gate) — Gate betrifft nur Daily/Next Target-Auswahl (siehe \`src/games/*/daily.ts\`).\n\n`;

md += `## Quellen & Pipeline\n\n- Core: DWDS Lemma DB + LanguageTool german-pos-dict → \`scripts/import-dwds-words.mjs\` (pro Länge 4 Dateien: allowed/target/erweitert/hart/wordMeta) — Zipf via \`scripts/data/subtlex-de.tsv\`.\n- Bio: \`scripts/data/bio.tsv\` → \`scripts/import-bio-words.mjs\` (pro Länge Bio-Targets).\n- Shared Helpers: \`scripts/pipeline/shared.mjs\`, Adapter: \`scripts/sources/{dwds,morphology,bio}.mjs\`. Neu = 1 Adapter + 1 TSV + \`wordConfig.ts:PACKS\`.\n- Generierung: \`yarn content:generate\` (words:import + bio + wortleiter) · Quick-Skip: \`scripts/content-generate-if-needed.mjs\`.\n\n`;

md += `---\n*Regenerieren: \`yarn words:stats\` nach \`yarn content:generate\`. Nicht von Hand editieren — Script überschreibt.*\n`;

await mkdir(path.dirname(outPath), { recursive: true });
await writeFile(outPath, md, "utf8");
console.log(`Wrote ${path.relative(process.cwd(), outPath)}`);
for (const r of rows) {
  console.log(`  ${r.len}: allowed=${r.allowed} target=${r.target} erweitert=${r.erweitert} hart=${r.hart} bio=${r.bio}`);
}
