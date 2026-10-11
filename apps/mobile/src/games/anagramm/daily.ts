import { getBerlinDateKey } from "@/daily/date";
import type { BucketPreset } from "@/games/wordBuckets";

import { ANAGRAMM_CONTENT_VERSION, anagrammTargetsByPreset } from "./content";
import { createAnagrammState, getAnagrammSolutions, normalizeAnagrammWord, shuffleAnagrammLetters } from "./engine";
import type { AnagrammDifficulty, AnagrammPuzzle, AnagrammWordLength } from "./types";

const lengths: readonly AnagrammWordLength[] = [4, 5, 6, 7, 8];
const weights: Record<AnagrammWordLength, number> = { 4: 18, 5: 30, 6: 24, 7: 18, 8: 10 };

export function getAnagrammDifficulty(wordLength: AnagrammWordLength): AnagrammDifficulty {
  return wordLength <= 5 ? "easy" : wordLength <= 7 ? "medium" : "hard";
}

export function createDailyAnagrammGame(date = new Date(), preset: BucketPreset = "klassisch") {
  return createNextAnagrammGame(undefined, getBerlinDateKey(date), preset);
}

export function createNextAnagrammGame(previousAnswer?: string, dateKey = "Freies Spiel", preset: BucketPreset = "klassisch") {
  const targetsByLength = anagrammTargetsByPreset[preset];
  const wordLength = pickLength(targetsByLength);
  const targets = targetsByLength[wordLength];
  const options = targets.filter((word) => word !== previousAnswer);
  const answer = (options.length ? options : targets)[Math.floor(Math.random() * (options.length ? options.length : targets.length))];
  if (!answer) throw new Error("No Anagramm target words available.");
  const puzzle = createAnagrammPuzzle(answer, `anagramm-next-${Date.now()}`);
  return { dateKey, puzzle, state: createAnagrammState(puzzle) };
}

export function createAnagrammPuzzle(answer: string, id: string): AnagrammPuzzle {
  const normalized = normalizeAnagrammWord(answer);
  const wordLength = Array.from(normalized).length as AnagrammWordLength;
  if (!lengths.includes(wordLength)) throw new Error("Anagramm supports 4- to 8-letter words.");
  const acceptedAnswers = getAnagrammSolutions(wordLength, normalized);
  return {
    id,
    version: ANAGRAMM_CONTENT_VERSION,
    answer: normalized,
    shuffledLetters: shuffleAnagrammLetters(normalized),
    acceptedAnswers: acceptedAnswers.length ? [...acceptedAnswers] : [normalized],
    wordLength,
    difficulty: getAnagrammDifficulty(wordLength),
    maxAttempts: 5,
  };
}

export function restoreAnagrammPuzzle(value: unknown): AnagrammPuzzle | null {
  const item = value as Partial<AnagrammPuzzle> | null | undefined;
  if (!item || typeof item.answer !== "string") return null;
  try {
    const fallback = createAnagrammPuzzle(item.answer, typeof item.id === "string" ? item.id : `anagramm-restored-${Date.now()}`);
    const shuffledLetters = Array.isArray(item.shuffledLetters) && item.shuffledLetters.length === fallback.wordLength
      ? item.shuffledLetters.map(normalizeAnagrammWord)
      : fallback.shuffledLetters;
    const acceptedAnswers = Array.isArray(item.acceptedAnswers) && item.acceptedAnswers.length
      ? item.acceptedAnswers.map(normalizeAnagrammWord)
      : fallback.acceptedAnswers;
    return { ...fallback, version: typeof item.version === "number" ? item.version : ANAGRAMM_CONTENT_VERSION, shuffledLetters, acceptedAnswers };
  } catch {
    return null;
  }
}

function pickLength(targetsByLength: Record<AnagrammWordLength, readonly string[]>): AnagrammWordLength {
  const available = lengths.filter((length) => targetsByLength[length]?.length);
  const total = available.reduce((sum, length) => sum + weights[length], 0);
  let roll = Math.random() * total;
  for (const length of available) {
    roll -= weights[length];
    if (roll < 0) return length;
  }
  return available[0] ?? 4;
}
