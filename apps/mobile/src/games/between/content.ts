import { generatedAllowedGuesses } from "./generated/allowedGuesses";

export const CONTENT_VERSION = "2026-08-18-a";
export const WORD_LENGTH = 5;

export const targetWords = [
  "abend",
  "ampel",
  "apfel",
  "blume",
  "brise",
  "danke",
  "durst",
  "eimer",
  "faden",
  "farbe",
  "frage",
  "glanz",
  "grube",
  "hafen",
  "honig",
  "insel",
  "kerze",
  "klang",
  "krone",
  "lampe",
  "leise",
  "licht",
  "mauer",
  "mensa",
  "nacht",
  "nadel",
  "orden",
  "pause",
  "preis",
  "qualm",
  "regen",
  "reise",
  "runde",
  "sache",
  "salat",
  "spatz",
  "tafel",
  "traum",
  "wolke",
  "zange"
].sort();

const generatedGuessSet = new Set<string>(generatedAllowedGuesses);
const missingTargetWords = targetWords.filter((word) => !generatedGuessSet.has(word));

export const allowedGuesses = missingTargetWords.length === 0
  ? generatedAllowedGuesses
  : [...generatedAllowedGuesses, ...missingTargetWords].sort(new Intl.Collator("de-DE", { sensitivity: "base" }).compare);

export const targetWordCount = targetWords.length;
export const allowedGuessCount = allowedGuesses.length;
