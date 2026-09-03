import { guessWords } from "./content";
import { WortcodeLetterMark, WortcodePuzzle, WortcodeState, WortcodeSubmitResult } from "./types";

const allowedGuesses = new Set(guessWords);

export function normalizeWortcodeGuess(value: string): string {
  return value.normalize("NFC").trim().toLocaleLowerCase("de-DE").replace(/ß/g, "ss");
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

  if (!/^[a-zäöü]+$/u.test(value)) {
    return { ok: false, state, reason: "Bitte nur Buchstaben eingeben." };
  }

  if (!allowedGuesses.has(value)) {
    return { ok: false, state, reason: "Unbekanntes Wort." };
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

export function toggleWortcodeLetterMark(state: WortcodeState, guessIndex: number, letterIndex: number): WortcodeState {
  const guess = state.guesses[guessIndex];
  const letters = guess ? Array.from(guess.value) : [];

  if (!guess || letterIndex < 0 || letterIndex >= letters.length) {
    return state;
  }

  const mark = getWortcodeEffectiveMarks(state)[guessIndex]?.[letterIndex] ?? "none";
  const nextMark = mark === "none" ? "included" : mark === "included" ? "exact" : mark === "exact" ? "excluded" : "none";
  const selectedLetter = letters[letterIndex];

  return {
    ...state,
    guesses: state.guesses.map((item, index) => {
      const itemLetters = Array.from(item.value);
      const marks = Array.from({ length: itemLetters.length }, (_, markIndex) => item.marks?.[markIndex] ?? "none" as WortcodeLetterMark);

      if (mark === "excluded") {
        itemLetters.forEach((letter, markIndex) => {
          if (letter === selectedLetter && marks[markIndex] === "excluded") marks[markIndex] = "none";
        });
      }

      if (index === guessIndex) marks[letterIndex] = nextMark;

      return { ...item, marks };
    })
  };
}

export function getWortcodeEffectiveMarks(state: WortcodeState): WortcodeLetterMark[][] {
  const excluded = new Set<string>();
  const exactByPosition = new Map<number, Set<string>>();

  for (const guess of state.guesses) {
    Array.from(guess.value).forEach((letter, index) => {
      const mark = guess.marks?.[index] ?? "none";
      if (mark === "excluded") excluded.add(letter);
      if (mark === "exact") {
        const letters = exactByPosition.get(index) ?? new Set<string>();
        letters.add(letter);
        exactByPosition.set(index, letters);
      }
    });
  }

  return state.guesses.map((guess) => Array.from(guess.value).map((letter, index) => {
    if (excluded.has(letter)) return "excluded";
    if (exactByPosition.get(index)?.has(letter)) return "exact";
    return guess.marks?.[index] ?? "none";
  }));
}

export function revealWortcodeSolution(state: WortcodeState): WortcodeState {
  return { ...state, status: "revealed" };
}

export function getWortcodeHintPosition(puzzle: WortcodePuzzle, state: WortcodeState): number | null {
  const revealed = new Set(state.revealedIndices ?? []);
  const available: number[] = [];
  for (let i = 0; i < puzzle.wordLength; i += 1) if (!revealed.has(i)) available.push(i);
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

export function applyWortcodeHint(puzzle: WortcodePuzzle, state: WortcodeState): WortcodeState {
  if (state.status !== "playing") return state;
  const pos = getWortcodeHintPosition(puzzle, state);
  if (pos === null) return state;
  return { ...state, revealedIndices: [...(state.revealedIndices ?? []), pos] };
}

export function getWortcodeRevealedLetters(puzzle: WortcodePuzzle, state: WortcodeState): (string | null)[] {
  const letters = Array.from(normalizeWortcodeGuess(puzzle.answer));
  const revealed = new Set(state.revealedIndices ?? []);
  return letters.map((ch, i) => (revealed.has(i) ? ch : null));
}
