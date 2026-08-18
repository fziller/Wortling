import { guessWords } from "./content";
import { WortcodePuzzle, WortcodeState, WortcodeSubmitResult } from "./types";

const allowedGuesses = new Set(guessWords);

export function normalizeWortcodeGuess(value: string): string {
  return value.normalize("NFC").trim().toLocaleLowerCase("de-DE");
}

export function evaluateGuess(answer: string, guess: string) {
  const answerChars = Array.from(normalizeWortcodeGuess(answer));
  const guessChars = Array.from(normalizeWortcodeGuess(guess));
  const answerUsed = Array(answerChars.length).fill(false);
  const guessUsed = Array(guessChars.length).fill(false);
  let exactMatches = 0;

  for (let index = 0; index < answerChars.length; index += 1) {
    if (answerChars[index] === guessChars[index]) {
      exactMatches += 1;
      answerUsed[index] = true;
      guessUsed[index] = true;
    }
  }

  let misplacedMatches = 0;

  for (let guessIndex = 0; guessIndex < guessChars.length; guessIndex += 1) {
    if (guessUsed[guessIndex]) continue;

    for (let answerIndex = 0; answerIndex < answerChars.length; answerIndex += 1) {
      if (answerUsed[answerIndex]) continue;

      if (guessChars[guessIndex] === answerChars[answerIndex]) {
        misplacedMatches += 1;
        answerUsed[answerIndex] = true;
        guessUsed[guessIndex] = true;
        break;
      }
    }
  }

  return { exactMatches, misplacedMatches };
}

export function createWortcodeState(puzzle: WortcodePuzzle): WortcodeState {
  return { puzzleId: puzzle.id, guesses: [], status: "playing" };
}

export function submitWortcodeGuess(puzzle: WortcodePuzzle, state: WortcodeState, rawGuess: string): WortcodeSubmitResult {
  const value = normalizeWortcodeGuess(rawGuess);

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

  const result = evaluateGuess(puzzle.answer, value);
  const guess = { value, ...result };
  const won = result.exactMatches === puzzle.wordLength;
  const lost = !won && state.guesses.length + 1 >= puzzle.maxAttempts;

  return { ok: true, guess, state: { ...state, guesses: [...state.guesses, guess], status: won ? "won" : lost ? "lost" : "playing" } };
}
