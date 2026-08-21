import { allowedGuesses, WORD_LENGTH } from "./content";
import { BetweenState, GuessResult } from "./types";

const collator = new Intl.Collator("de-DE", { sensitivity: "base" });
const allowedGuessSet = new Set(allowedGuesses);
const wordRankByWord = new Map(allowedGuesses.map((word, index) => [word, index]));

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

export function getWordPercent(word: string): number {
  if (word === "aaaaa") {
    return 0;
  }

  if (word === "zzzzz") {
    return 100;
  }

  return Math.round((getWordRank(word) / Math.max(allowedGuesses.length - 1, 1)) * 100);
}

export function getRemainingPercent(state: BetweenState): number {
  return Math.max(0, getWordPercent(state.upperBound) - getWordPercent(state.lowerBound));
}

export function getWordRank(word: string): number {
  if (word === "aaaaa") {
    return 0;
  }

  if (word === "zzzzz") {
    return allowedGuesses.length - 1;
  }

  const normalizedWord = normalizeWord(word);
  const rank = wordRankByWord.get(normalizedWord);

  if (rank !== undefined) {
    return rank;
  }

  let low = 0;
  let high = allowedGuesses.length - 1;
  let index = -1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);

    if (compareWords(allowedGuesses[middle], normalizedWord) >= 0) {
      index = middle;
      high = middle - 1;
    } else {
      low = middle + 1;
    }
  }

  return index === -1 ? allowedGuesses.length - 1 : index;
}

export function getGuessDistancePercent(state: BetweenState): number | null {
  const lastGuess = state.guesses[state.guesses.length - 1];

  if (!lastGuess) {
    return null;
  }

  const distance = Math.abs(getWordRank(state.targetWord) - getWordRank(lastGuess.word));
  const percent = (distance / Math.max(allowedGuesses.length - 1, 1)) * 100;

  return Math.round(percent * 10) / 10;
}

export function getGuessRangePositionPercent(state: BetweenState): number {
  const lastGuess = state.guesses[state.guesses.length - 1];

  if (!lastGuess) {
    return 50;
  }

  const lowerRank = getWordRank(state.lowerBound);
  const upperRank = getWordRank(state.upperBound);
  const guessRank = getWordRank(lastGuess.word);

  return Math.round(((guessRank - lowerRank) / Math.max(upperRank - lowerRank, 1)) * 100);
}

export function getTargetRangeMetrics(state: BetweenState) {
  const lowerRank = getWordRank(state.lowerBound);
  const upperRank = getWordRank(state.upperBound);
  const targetRank = getWordRank(state.targetWord);
  const totalWords = Math.max(allowedGuesses.length - 1, 1);
  const rangeSize = Math.max(upperRank - lowerRank, 1);
  const topDistance = targetRank - lowerRank;
  const bottomDistance = upperRank - targetRank;

  return {
    targetPositionPercent: Math.round((topDistance / rangeSize) * 100),
    topDistancePercent: Math.round((topDistance / totalWords) * 1000) / 10,
    bottomDistancePercent: Math.round((bottomDistance / totalWords) * 1000) / 10
  };
}


export function revealSolution(state: BetweenState): BetweenState {
  return { ...state, status: "revealed" };
}

export function abandonGame(state: BetweenState): BetweenState {
  return { ...state, status: "abandoned" };
}

export function submitGuess(state: BetweenState, rawGuess: string): GuessResult {
  const word = normalizeWord(rawGuess);

  if (state.status !== "playing") {
    return { ok: false, state, reason: "Diese Runde ist schon gelöst." };
  }

  if (Array.from(word).length !== WORD_LENGTH) {
    return { ok: false, state, reason: `Bitte genau ${WORD_LENGTH} Buchstaben eingeben.` };
  }

  if (!allowedGuessSet.has(word)) {
    return { ok: false, state, reason: "Dieses deutsche Wort kenne ich noch nicht." };
  }

  if (state.guesses.some((guess) => guess.word === word)) {
    return { ok: false, state, reason: "Das Wort hattest du schon." };
  }

  const targetComparison = compareWords(word, state.targetWord);

  if (targetComparison === 0) {
    const guess = { word, direction: "hit" as const, percent: getWordPercent(word) };
    return { ok: true, guess, state: { ...state, guesses: [...state.guesses, guess], status: "won" } };
  }

  const guess = {
    word,
    direction: targetComparison < 0 ? "after" as const : "before" as const,
    percent: getWordPercent(word)
  };
  const nextState = {
    ...state,
    guesses: [...state.guesses, guess],
    lowerBound: guess.direction === "after" && compareWords(word, state.lowerBound) > 0 ? word : state.lowerBound,
    upperBound: guess.direction === "before" && compareWords(word, state.upperBound) < 0 ? word : state.upperBound
  };

  return { ok: true, guess, state: nextState };
}
