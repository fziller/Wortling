import { guessWords as fiveLetterGuesses } from "../worttreffer/content";

export const FORMWORT_CONTENT_VERSION = 1;
export const FORMWORT_WORD_LENGTH = 5;
export const FORMWORT_MAX_ATTEMPTS = 6;

export const formwortAnswers = [
  "allee",
  "essen",
  "innen",
  "kette",
  "motto",
  "puppe",
  "seele",
  "tasse"
] as const;

export const formwortGuessWords = Array.from(new Set([...formwortAnswers, ...fiveLetterGuesses])).sort();
