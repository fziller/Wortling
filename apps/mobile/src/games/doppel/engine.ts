import { DoppelGuessResult, DoppelPuzzle, DoppelState } from "./types";

export function normalizeDoppelGuess(value: string): string {
  return value.normalize("NFC").trim().toLocaleLowerCase("de-DE");
}

export function createDoppelState(puzzle: DoppelPuzzle): DoppelState {
  return { puzzleId: puzzle.id, guesses: [], unlockedHints: 0, status: "playing" };
}

export function submitDoppelGuess(puzzle: DoppelPuzzle, state: DoppelState, rawGuess: string): DoppelGuessResult {
  const guess = normalizeDoppelGuess(rawGuess);

  if (state.status !== "playing") {
    return { ok: false, state, reason: "Diese Runde ist schon beendet." };
  }

  if (!guess) {
    return { ok: false, state, reason: "Gib ein Wort ein." };
  }

  if (state.guesses.includes(guess)) {
    return { ok: false, state, reason: "Schon versucht." };
  }

  const solution = puzzle.solutions.find((item) => normalizeDoppelGuess(item.answer) === guess);

  if (solution) {
    return { ok: true, solution, state: { ...state, guesses: [...state.guesses, guess], solvedAnswer: solution.answer, status: "won" } };
  }

  return { ok: false, state: { ...state, guesses: [...state.guesses, guess] }, reason: "Diese Verbindung haben wir nicht als Lösung." };
}

export function unlockDoppelHint(puzzle: DoppelPuzzle, state: DoppelState): DoppelState {
  const hintCount = puzzle.hints?.length ?? 0;

  return { ...state, unlockedHints: Math.min(state.unlockedHints + 1, hintCount) };
}

export function revealDoppelSolution(puzzle: DoppelPuzzle, state: DoppelState): DoppelState {
  return { ...state, solvedAnswer: puzzle.solutions[0]?.answer, status: "revealed" };
}
