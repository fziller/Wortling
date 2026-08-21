import type { KeyboardLetterState } from "@/components/WordKeyboard";

import { evaluateWorttrefferGuess, normalizeWorttrefferGuess } from "../worttreffer/engine";

import { FORMWORT_WORD_LENGTH, formwortGuessWords } from "./content";
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

export function submitFormwortGuess(puzzle: FormwortPuzzle, state: FormwortState, rawGuess: string): FormwortSubmitResult {
  const value = normalizeWorttrefferGuess(rawGuess);

  if (state.status !== "playing") {
    return { ok: false, state, reason: "Diese Runde ist schon beendet." };
  }

  if (Array.from(value).length !== puzzle.wordLength) {
    return { ok: false, state, reason: `Bitte gib ein Wort mit ${puzzle.wordLength} Buchstaben ein.` };
  }

  if (!/^[a-zäöüß]+$/u.test(value)) {
    return { ok: false, state, reason: "Bitte nur Buchstaben eingeben." };
  }

  if (!allowedGuesses.has(value)) {
    return { ok: false, state, reason: "Dieses Wort ist nicht in unserer Wortliste." };
  }

  if (state.guesses.some((guess) => guess.value === value)) {
    return { ok: false, state, reason: "Schon versucht." };
  }

  const marks = evaluateWorttrefferGuess(puzzle.answer, value);
  const guess = { value, marks };
  const won = marks.every((mark) => mark === "correct");
  const lost = !won && state.guesses.length + 1 >= puzzle.maxAttempts;

  return { ok: true, guess, state: { ...state, guesses: [...state.guesses, guess], status: won ? "won" : lost ? "lost" : "playing" } };
}

export function revealFormwortSolution(state: FormwortState): FormwortState {
  return { ...state, status: "revealed" };
}
