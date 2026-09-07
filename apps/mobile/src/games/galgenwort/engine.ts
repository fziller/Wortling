import type { KeyboardLetterState } from "@/components/WordKeyboard";

import type { GalgenwortGuessResult, GalgenwortPuzzle, GalgenwortState } from "./types";

export function normalizeGalgenwortLetter(value: string): string {
  return Array.from(value.normalize("NFC").trim().toLocaleLowerCase("de-DE").replace(/ß/g, "ss"))[0] ?? "";
}

export function createGalgenwortState(puzzle: GalgenwortPuzzle): GalgenwortState {
  return { puzzleId: puzzle.id, guessedLetters: [], status: "playing" };
}

export function getGalgenwortAnswerLetters(answer: string): string[] {
  return Array.from(answer.normalize("NFC").toLocaleLowerCase("de-DE").replace(/ß/g, "ss")).filter((letter) => /^[a-zäöü]$/u.test(letter));
}

export function getGalgenwortWrongLetters(puzzle: GalgenwortPuzzle, state: GalgenwortState): string[] {
  const answerLetters = new Set(getGalgenwortAnswerLetters(puzzle.answer));

  return state.guessedLetters.filter((letter) => !answerLetters.has(letter));
}

export function getGalgenwortRevealedLetters(puzzle: GalgenwortPuzzle, state: GalgenwortState): string[] {
  const guessed = new Set(state.guessedLetters);

  return Array.from(puzzle.answer).map((letter) => {
    const normalized = normalizeGalgenwortLetter(letter);
    return guessed.has(normalized) || !/^[a-zäöü]$/u.test(normalized) ? letter : "";
  });
}

export function getGalgenwortLetterStates(puzzle: GalgenwortPuzzle, state: GalgenwortState): Record<string, KeyboardLetterState> {
  const answerLetters = new Set(getGalgenwortAnswerLetters(puzzle.answer));

  return Object.fromEntries(state.guessedLetters.map((letter) => [letter, answerLetters.has(letter) ? "correct" : "absent"]));
}

export function submitGalgenwortLetter(puzzle: GalgenwortPuzzle, state: GalgenwortState, rawLetter: string): GalgenwortGuessResult {
  const letter = normalizeGalgenwortLetter(rawLetter);

  if (state.status !== "playing") {
    return { ok: false, state, reason: "Diese Runde ist schon beendet." };
  }

  if (!/^[a-zäöü]$/u.test(letter)) {
    return { ok: false, state, reason: "Bitte wähle einen Buchstaben." };
  }

  if (state.guessedLetters.includes(letter)) {
    return { ok: false, state, reason: "Schon versucht." };
  }

  const guessedLetters = [...state.guessedLetters, letter];
  const nextState = { ...state, guessedLetters };
  const correct = getGalgenwortAnswerLetters(puzzle.answer).includes(letter);
  const won = getGalgenwortRevealedLetters(puzzle, nextState).every(Boolean);
  const lost = !won && getGalgenwortWrongLetters(puzzle, nextState).length >= puzzle.maxWrongGuesses;

  return { ok: true, correct, state: { ...nextState, status: won ? "won" : lost ? "lost" : "playing" } };
}

export function revealGalgenwortSolution(state: GalgenwortState): GalgenwortState {
  return { ...state, status: "revealed" };
}

export function getGalgenwortHintLetter(puzzle: GalgenwortPuzzle, state: GalgenwortState): string | null {
  const guessed = new Set(state.guessedLetters);
  const available = [...new Set(getGalgenwortAnswerLetters(puzzle.answer))].filter((letter) => !guessed.has(letter));

  return available[0] ?? null;
}

export function applyGalgenwortHint(puzzle: GalgenwortPuzzle, state: GalgenwortState): GalgenwortState {
  if (state.status !== "playing") return state;
  const letter = getGalgenwortHintLetter(puzzle, state);
  if (!letter) return state;
  const guessedLetters = [...state.guessedLetters, letter];
  const nextState = { ...state, guessedLetters };
  const won = getGalgenwortRevealedLetters(puzzle, nextState).every(Boolean);

  return { ...nextState, status: won ? "won" : "playing" };
}
