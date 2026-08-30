// Shared pipeline helpers — extracted from import-dwds-words.mjs for reuse across packages.
// ponytail: single place for shape/bucket/tier logic so new sources don't copy-paste it.

export const BLOCKED_WORDS = new Set([
  "abcs", "abms", "adac", "akws", "asvg", "bdsg", "bmws", "bshg", "btmg", "bvwg",
  "cpus", "crms", "cvjm", "daad", "ddos", "egmr", "ehec", "ehnl", "ekgs",
  "fckw", "fdgo", "fsme", "gmbh", "gpus", "hdmi", "http", "isbn", "isdn", "issn",
  "jvas", "kfzs", "ldpd", "lgbt", "lkws", "mbit", "mpox", "mrna", "mvas", "nvas",
  "oecd", "oems", "öpnv", "pdfs", "pkws", "pvcs", "rfid", "scsi", "stpo", "stvo",
]);

export function normalizeWord(word) {
  return String(word ?? "")
    .normalize("NFC")
    .trim()
    .toLocaleLowerCase("de-DE")
    .replace(/ß/g, "ss");
}

export function hasValidShape(word, wordLength) {
  return Array.from(word).length === wordLength && /^[a-zäöü]+$/u.test(word) && !BLOCKED_WORDS.has(word);
}

export function getTier(zipf, thresholds) {
  if (zipf >= thresholds.easy) return "easy";
  if (zipf >= thresholds.medium) return "medium";
  if (zipf >= thresholds.hard) return "hard";
  return "unknown";
}

export function classifyBucket(word, tags) {
  if (!tags || tags.size === 0) return "base";
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
    if (tag === "DWDS:BASE" || tag === "BIO:BASE") {
      hasSubSingular = true;
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
  return "base";
}

export const DWDS_ALLOWED_POS = new Set(["Adjektiv", "Adverb", "Interjektion", "Substantiv", "Verb"]);

export function isAllowedDwdsEntry(entry, wordLength) {
  const word = normalizeWord(entry.lemma);
  return DWDS_ALLOWED_POS.has(entry.pos) && hasValidShape(word, wordLength);
}

export function isAllowedPosTag(form, lemma, tag, wordLength) {
  const word = normalizeWord(form);
  if (!hasValidShape(word, wordLength)) return false;
  if (tag.startsWith("SUB:")) return true;
  if (tag.startsWith("VER:")) {
    return tag.includes(":INF") || tag.includes(":PRÄ:") || tag.includes(":PRT:") || tag.includes(":PA") || tag.includes(":KJ") || tag.includes(":IMP");
  }
  if (tag.startsWith("ADJ:")) return true;
  return false;
}
