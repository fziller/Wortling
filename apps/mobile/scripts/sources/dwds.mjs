// DWDS source adapter — fetches lemmas from https://www.dwds.de/lemma/json
import { isAllowedDwdsEntry, normalizeWord } from "../pipeline/shared.mjs";

const DWDS_URL = "https://www.dwds.de/lemma/json";

export async function fetchDwdsWords(wordLength) {
  const response = await fetch(DWDS_URL);
  if (!response.ok) throw new Error(`Failed to download DWDS lemma data: ${response.status} ${response.statusText}`);
  const entries = await response.json();
  const result = [];
  for (const entry of entries) {
    if (isAllowedDwdsEntry(entry, wordLength)) {
      const w = normalizeWord(entry.lemma);
      result.push({ form: w, lemma: entry.lemma, tag: "DWDS:BASE", sourceId: "dwds" });
    }
  }
  return result;
}
