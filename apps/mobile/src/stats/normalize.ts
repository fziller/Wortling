export function normalizeWord(word: string): string {
  return word.trim().toLocaleLowerCase("de-DE").normalize("NFC").replace(/ß/g, "ss");
}
