import { allowedGuesses, WORD_LENGTH } from "./content";
import { BetweenState, GuessResult } from "./types";

const collator = new Intl.Collator("de-DE", { sensitivity: "base" });
const alphabet = "abcdefghijklmnopqrstuvwxyz";
const allowedGuessSet = new Set(allowedGuesses);
const wordRankByWord = new Map(allowedGuesses.map((word, index) => [word, index]));

export function normalizeWord(word: string): string {
  return word.trim().toLocaleLowerCase("de-DE").replace(/ß/g, "ss");
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

export function getBetweenHintPosition(state: BetweenState): number | null {
  const letters = Array.from(state.targetWord);
  const revealed = new Set(state.revealedHintIndices ?? []);
  const available = letters.map((_, index) => index).filter((index) => !revealed.has(index));

  return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null;
}

export function applyBetweenHint(state: BetweenState): BetweenState {
  if (state.status !== "playing") return state;
  const pos = getBetweenHintPosition(state);
  if (pos === null) return state;

  return { ...state, revealedHintIndices: [...(state.revealedHintIndices ?? []), pos] };
}

export function getBetweenRevealedHintLetters(state: BetweenState): (string | null)[] {
  const revealed = new Set(state.revealedHintIndices ?? []);
  return Array.from(state.targetWord).map((letter, index) => revealed.has(index) ? letter : null);
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
  const rangeSize = Math.max(upperRank - lowerRank, 1);
  const topDistance = targetRank - lowerRank;
  const bottomDistance = upperRank - targetRank;

  return {
    targetPositionPercent: Math.round((topDistance / rangeSize) * 100),
    topDistanceWords: Math.max(topDistance - 1, 0),
    bottomDistanceWords: Math.max(bottomDistance - 1, 0),
    remainingWords: Math.max(upperRank - lowerRank - 1, 0)
  };
}

export function getOpenAlphabetLetters(
  lowerBound: string,
  upperBound: string,
  index: number,
  inputLetters: readonly string[] = []
): string[] {
  const normalizedLower = normalizeWord(lowerBound);
  const normalizedUpper = normalizeWord(upperBound);
  const prefix = normalizeWord(inputLetters.slice(0, index).join(""));

  if (prefix.length < index) {
    return alphabet.toLocaleUpperCase("de-DE").split("");
  }

  return alphabet
    .split("")
    .filter((letter) => {
      const candidatePrefix = `${prefix}${letter}`;
      const remainingLength = WORD_LENGTH - candidatePrefix.length;
      const lowestCandidate = `${candidatePrefix}${"a".repeat(remainingLength)}`;
      const highestCandidate = `${candidatePrefix}${"z".repeat(remainingLength)}`;

      return compareWords(highestCandidate, normalizedLower) > 0 && compareWords(lowestCandidate, normalizedUpper) < 0;
    })
    .join("")
    .toLocaleUpperCase("de-DE")
    .split("");
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
