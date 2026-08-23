import { getBerlinDateKey } from "@/daily/date";
import { getWordLength, isSupportedWordLength, pickRandomTargetWord, type SupportedWordLength } from "@/games/wordLengths";

import { WORTCODE_CONTENT_VERSION, wortcodeTargetsByLength } from "./content";
import { createWortcodeState } from "./engine";
import { WortcodePuzzle } from "./types";

type WortcodeWordLength = Exclude<SupportedWordLength, 4>;

const maxAttemptsByLength = { 5: 7, 6: 8, 7: 9 } as const satisfies Record<WortcodeWordLength, number>;
const difficultyByLength = { 5: "easy", 6: "medium", 7: "hard" } as const satisfies Record<WortcodeWordLength, WortcodePuzzle["difficulty"]>;

export function createDailyWortcodeGame(date = new Date()) {
  const dateKey = getBerlinDateKey(date);

  return createPracticeWortcodeGame(undefined, dateKey);
}

export function createPracticeWortcodeGame(previousAnswer?: string, dateKey = "Freies Spiel") {
  const { answer, wordLength } = pickRandomTargetWord(wortcodeTargetsByLength, previousAnswer);
  if (!isWortcodeWordLength(wordLength)) throw new Error("Wortcode only supports 5- to 7-letter words.");
  const puzzle = createWortcodePuzzle(answer, wordLength, `wortcode-practice-${Date.now()}`);

  return { dateKey, puzzle, state: createWortcodeState(puzzle) };
}

export function getWortcodeMaxAttempts(wordLength: WortcodeWordLength): number {
  return maxAttemptsByLength[wordLength];
}

export function getWortcodeDifficulty(wordLength: WortcodeWordLength): WortcodePuzzle["difficulty"] {
  return difficultyByLength[wordLength];
}

export function createWortcodePuzzle(answer: string, wordLength: WortcodeWordLength, id: string): WortcodePuzzle {
  return {
    id,
    version: WORTCODE_CONTENT_VERSION,
    answer,
    wordLength,
    maxAttempts: getWortcodeMaxAttempts(wordLength),
    difficulty: getWortcodeDifficulty(wordLength),
  };
}

export function restoreWortcodePuzzle(value: unknown): WortcodePuzzle | null {
  const item = value as Partial<WortcodePuzzle> | null | undefined;
  if (!item || typeof item.answer !== "string") return null;

  const inferredLength = getWordLength(item.answer);
  const wordLength = isWortcodeWordLength(item.wordLength) ? item.wordLength : isWortcodeWordLength(inferredLength) ? inferredLength : null;
  if (!wordLength || inferredLength !== wordLength) return null;

  return {
    id: typeof item.id === "string" ? item.id : `wortcode-restored-${Date.now()}`,
    version: typeof item.version === "number" ? item.version : WORTCODE_CONTENT_VERSION,
    answer: item.answer,
    wordLength,
    maxAttempts: typeof item.maxAttempts === "number" && item.maxAttempts > 0 ? item.maxAttempts : getWortcodeMaxAttempts(wordLength),
    difficulty: item.difficulty === "easy" || item.difficulty === "medium" || item.difficulty === "hard" ? item.difficulty : getWortcodeDifficulty(wordLength),
  };
}

function isWortcodeWordLength(value: unknown): value is WortcodeWordLength {
  return isSupportedWordLength(value) && value !== 4;
}
