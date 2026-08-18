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

export const allowedGuesses = Array.from(new Set([...targetWords, ...generatedAllowedGuesses])).sort();

export const targetWordCount = targetWords.length;
export const allowedGuessCount = allowedGuesses.length;
