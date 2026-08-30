// Morphology source adapter — streams the LanguageTool POS dump.
// Relies on posDumpPath already prepared by import-dwds-words pipeline (java DictionaryExporter).
import { createReadStream } from "node:fs";
import readline from "node:readline";
import { isAllowedPosTag, normalizeWord } from "../pipeline/shared.mjs";

export async function* streamMorphologyWords(posDumpPath, wordLength) {
  const lines = readline.createInterface({ input: createReadStream(posDumpPath, "utf8"), crlfDelay: Infinity });
  for await (const line of lines) {
    const [form, lemma, tag] = line.split("\t");
    if (isAllowedPosTag(form, lemma, tag, wordLength)) {
      const word = normalizeWord(form);
      yield { form: word, lemma, tag, sourceId: "morphology" };
    }
  }
}
