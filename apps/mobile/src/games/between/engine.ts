import { allowedGuesses, WORD_LENGTH } from "./content";
import { BetweenState, GuessResult } from "./types";

const collator = new Intl.Collator("de-DE", { sensitivity: "base" });

export function normalizeWord(word: string): string {
  return word.trim().toLocaleLowerCase("de-DE");
}

export function compareWords(left: string, right: string): number {
  return collator.compare(normalizeWord(left), normalizeWord(right));
}

export function createBetweenState(targetWord: string): BetweenState {
  return {
    targetWord: normalizeWord(targetWord),
    lowerBound: "aaaaa",
    upperBound: "zzzzz",
    guesses: [],
    status: "playing"
  };
}

export function submitGuess(state: BetweenState, rawGuess: string): GuessResult {
  const word = normalizeWord(rawGuess);

  if (state.status !== "playing") {
    return { ok: false, state, reason: "Diese Runde ist schon gelöst." };
  }

  if (Array.from(word).length !== WORD_LENGTH) {
    return { ok: false, state, reason: `Bitte genau ${WORD_LENGTH} Buchstaben eingeben.` };
  }

  if (!allowedGuesses.includes(word)) {
    return { ok: false, state, reason: "Dieses deutsche Wort kenne ich noch nicht." };
  }

  if (state.guesses.some((guess) => guess.word === word)) {
    return { ok: false, state, reason: "Das Wort hattest du schon." };
  }

  const targetComparison = compareWords(word, state.targetWord);

  if (targetComparison === 0) {
    const guess = { word, direction: "hit" as const };
    return { ok: true, guess, state: { ...state, guesses: [...state.guesses, guess], status: "won" } };
  }

  const guess = { word, direction: targetComparison < 0 ? "after" as const : "before" as const };
  const nextState = {
    ...state,
    guesses: [...state.guesses, guess],
    lowerBound: guess.direction === "after" && compareWords(word, state.lowerBound) > 0 ? word : state.lowerBound,
    upperBound: guess.direction === "before" && compareWords(word, state.upperBound) < 0 ? word : state.upperBound
  };

  return { ok: true, guess, state: nextState };
}
