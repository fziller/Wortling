import { guessWords } from "./content";
import { WorttrefferLetterStates, WorttrefferPuzzle, WorttrefferState, WorttrefferSubmitResult, WorttrefferTileMark } from "./types";

const allowedGuesses = new Set(guessWords);
const markRank = { unused: 0, absent: 1, present: 2, correct: 3 } as const;

export function normalizeWorttrefferGuess(value: string): string {
  return value.normalize("NFC").trim().toLocaleLowerCase("de-DE");
}

export function evaluateWorttrefferGuess(answer: string, guess: string): WorttrefferTileMark[] {
  const answerChars = Array.from(normalizeWorttrefferGuess(answer));
  const guessChars = Array.from(normalizeWorttrefferGuess(guess));
  const marks = Array<WorttrefferTileMark>(guessChars.length).fill("absent");
  const remaining = new Map<string, number>();

  for (let index = 0; index < answerChars.length; index += 1) {
    if (answerChars[index] === guessChars[index]) {
      marks[index] = "correct";
    } else {
      remaining.set(answerChars[index], (remaining.get(answerChars[index]) ?? 0) + 1);
    }
  }

  for (let index = 0; index < guessChars.length; index += 1) {
    if (marks[index] === "correct") continue;

    const count = remaining.get(guessChars[index]) ?? 0;
    if (count > 0) {
      marks[index] = "present";
      remaining.set(guessChars[index], count - 1);
    }
  }

  return marks;
}

export function createWorttrefferState(puzzle: WorttrefferPuzzle): WorttrefferState {
  return { puzzleId: puzzle.id, guesses: [], status: "playing" };
}

export function submitWorttrefferGuess(puzzle: WorttrefferPuzzle, state: WorttrefferState, rawGuess: string): WorttrefferSubmitResult {
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

export function getWorttrefferLetterStates(state: WorttrefferState): WorttrefferLetterStates {
  const letterStates: WorttrefferLetterStates = {};

  for (const guess of state.guesses) {
    Array.from(guess.value).forEach((letter, index) => {
      const mark = guess.marks[index];
      const current = letterStates[letter] ?? "unused";

      if (markRank[mark] > markRank[current]) {
        letterStates[letter] = mark;
      }
    });
  }

  return letterStates;
}

export function revealWorttrefferSolution(state: WorttrefferState): WorttrefferState {
  return { ...state, status: "revealed" };
}
