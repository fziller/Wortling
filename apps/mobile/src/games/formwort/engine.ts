import type { KeyboardLetterState } from "@/components/WordKeyboard";

import { evaluateWorttrefferGuess, normalizeWorttrefferGuess } from "../worttreffer/engine";

import { formwortGuessWords } from "./content";
import type { FormwortPuzzle, FormwortState, FormwortSubmitResult } from "./types";

const allowedGuesses = new Set(formwortGuessWords);
const markRank = { unused: 0, absent: 1, present: 2, correct: 3 } as const;
const symbolBank = ["◆", "◼", "▲", "●", "⬢", "◥", "◇", "◯"];

export function createFormwortSymbols(answer: string): string[] {
  const symbolsByLetter = new Map<string, string>();

  return Array.from(normalizeWorttrefferGuess(answer)).map((letter) => {
    const existing = symbolsByLetter.get(letter);
    if (existing) return existing;

    const symbol = symbolBank[symbolsByLetter.size] ?? "?";
    symbolsByLetter.set(letter, symbol);
    return symbol;
  });
}

export function createFormwortState(puzzle: FormwortPuzzle): FormwortState {
  return { puzzleId: puzzle.id, guesses: [], status: "playing" };
}

export function applyFormwortInputLetter(symbols: readonly string[], letters: readonly string[], cursorIndex: number, letter: string) {
  const symbol = symbols[cursorIndex];
  const nextLetters = letters.map((item, index) => symbols[index] === symbol ? letter : item);
  const nextEmptyAfterCursor = nextLetters.findIndex((item, index) => index > cursorIndex && !item);
  const nextEmpty = nextEmptyAfterCursor === -1 ? nextLetters.findIndex((item) => !item) : nextEmptyAfterCursor;

  return { letters: nextLetters, cursorIndex: nextEmpty === -1 ? cursorIndex : nextEmpty };
}

export function removeFormwortInputLetter(symbols: readonly string[], letters: readonly string[], cursorIndex: number) {
  const targetIndex = letters[cursorIndex] ? cursorIndex : Math.max(cursorIndex - 1, 0);
  const symbol = symbols[targetIndex];

  return { letters: letters.map((item, index) => symbols[index] === symbol ? "" : item), cursorIndex: targetIndex };
}

export function getFormwortLetterStates(state: FormwortState): Record<string, KeyboardLetterState> {
  const letterStates: Record<string, KeyboardLetterState> = {};

  for (const guess of state.guesses) {
    Array.from(guess.value).forEach((letter, index) => {
      const mark = guess.marks[index];
      const current = letterStates[letter] ?? "unused";

      if (markRank[mark] > markRank[current]) letterStates[letter] = mark;
    });
  }

  return letterStates;
}

export function submitFormwortGuess(puzzle: FormwortPuzzle, state: FormwortState, rawGuess: string, options: { ignoreAttemptLimit?: boolean } = {}): FormwortSubmitResult {
  const value = normalizeWorttrefferGuess(rawGuess);

  if (state.status !== "playing") {
    return { ok: false, state, reason: "Diese Runde ist schon beendet." };
  }

  if (Array.from(value).length !== puzzle.wordLength) {
    return { ok: false, state, reason: `Bitte gib ein Wort mit ${puzzle.wordLength} Buchstaben ein.` };
  }

  if (!/^[a-zäöü]+$/u.test(value)) {
    return { ok: false, state, reason: "Bitte nur Buchstaben eingeben." };
  }

  if (!allowedGuesses.has(value)) {
    return { ok: false, state, reason: "Unbekanntes Wort." };
  }

  if (state.guesses.some((guess) => guess.value === value)) {
    return { ok: false, state, reason: "Schon versucht." };
  }

  const marks = evaluateWorttrefferGuess(puzzle.answer, value);
  const guess = { value, marks };
  const won = marks.every((mark) => mark === "correct");
  const lost = !options.ignoreAttemptLimit && !won && state.guesses.length + 1 >= puzzle.maxAttempts;

  return { ok: true, guess, state: { ...state, guesses: [...state.guesses, guess], status: won ? "won" : lost ? "lost" : "playing" } };
}

export function revealFormwortSolution(state: FormwortState): FormwortState {
  return { ...state, status: "revealed" };
}

export function getFormwortHintPosition(puzzle: FormwortPuzzle, state: FormwortState, random = Math.random): number | null {
  const revealed = new Set(state.revealedIndices ?? []);
  const availableSymbols = [...new Set(puzzle.symbols.filter((symbol, index) => !revealed.has(index)))];
  if (availableSymbols.length === 0) return null;
  const symbol = availableSymbols[Math.floor(random() * availableSymbols.length)];

  return puzzle.symbols.findIndex((item, index) => item === symbol && !revealed.has(index));
}

export function applyFormwortHint(puzzle: FormwortPuzzle, state: FormwortState, random = Math.random): FormwortState {
  if (state.status !== "playing") return state;
  const pos = getFormwortHintPosition(puzzle, state, random);
  if (pos === null) return state;
  const symbol = puzzle.symbols[pos];
  const revealed = new Set(state.revealedIndices ?? []);
  puzzle.symbols.forEach((item, index) => {
    if (item === symbol) revealed.add(index);
  });

  return { ...state, revealedIndices: [...revealed] };
}

export function getFormwortRevealedLetters(puzzle: FormwortPuzzle, state: FormwortState): (string | null)[] {
  const letters = Array.from(normalizeWorttrefferGuess(puzzle.answer));
  const revealed = new Set(state.revealedIndices ?? []);
  return letters.map((ch, i) => (revealed.has(i) ? ch : null));
}
