import { allowedGuesses as fiveLetterGuesses } from "../between/content";

export const WORTTREFFER_CONTENT_VERSION = 1;
export const WORTTREFFER_WORD_LENGTH = 5;
export const WORTTREFFER_MAX_ATTEMPTS = 6;

export const answerWords = [
  "abend",
  "ampel",
  "apfel",
  "blume",
  "danke",
  "eimer",
  "farbe",
  "frage",
  "glanz",
  "honig",
  "insel",
  "kerze",
  "klang",
  "krone",
  "lampe",
  "licht",
  "mauer",
  "nacht",
  "nadel",
  "pause",
  "preis",
  "regen",
  "reise",
  "salat",
  "spatz",
  "tafel",
  "traum",
  "wolke",
  "zange"
] as const;

export const guessWords = Array.from(new Set([...answerWords, ...fiveLetterGuesses])).sort();
