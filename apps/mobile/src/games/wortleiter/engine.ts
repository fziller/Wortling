import { allowedGuesses } from "./content";
import { buildPatternBuckets, getWortleiterNeighbors, isValidTransition, normalizeWortleiterWord } from "./generator";
import type { WortleiterPuzzle, WortleiterState, WortleiterSubmitResult } from "./types";

const allowedGuessSet = new Set<string>(allowedGuesses);
let hintBuckets: Map<string, string[]> | null = null;

function getHintBuckets() {
  hintBuckets ??= buildPatternBuckets(allowedGuesses);
  return hintBuckets;
}

export { isValidTransition, normalizeWortleiterWord };

export function createWortleiterState(puzzle: WortleiterPuzzle): WortleiterState {
  return {
    puzzleId: puzzle.id,
    words: [normalizeWortleiterWord(puzzle.startWord)],
    status: "playing"
  };
}

export function submitWortleiterGuess(puzzle: WortleiterPuzzle, state: WortleiterState, rawGuess: string): WortleiterSubmitResult {
  const word = normalizeWortleiterWord(rawGuess);
  const previousWord = state.words[state.words.length - 1];

  if (state.status !== "playing") {
    return { ok: false, state, reason: "Diese Runde ist schon beendet." };
  }

  if (Array.from(word).length !== puzzle.wordLength) {
    return { ok: false, state, reason: `Bitte gib ein Wort mit ${puzzle.wordLength} Buchstaben ein.` };
  }

  if (!/^[a-zäöü]+$/u.test(word)) {
    return { ok: false, state, reason: "Bitte nur Buchstaben eingeben." };
  }

  if (word === previousWord) {
    return { ok: false, state, reason: "Du musst einen Buchstaben ändern." };
  }

  if (!allowedGuessSet.has(word)) {
    return { ok: false, state, reason: "Unbekanntes Wort." };
  }

  if (!isValidTransition(previousWord, word)) {
    return { ok: false, state, reason: "Ändere genau einen Buchstaben." };
  }

  if (state.words.includes(word)) {
    return { ok: false, state, reason: "Dieses Wort hast du schon benutzt." };
  }

  const words = [...state.words, word];
  const won = word === normalizeWortleiterWord(puzzle.targetWord);

  return {
    ok: true,
    word,
    state: {
      ...state,
      words,
      status: won ? "won" : "playing"
    }
  };
}

export function undoWortleiterStep(state: WortleiterState): WortleiterState {
  if (state.status !== "playing" || state.words.length <= 1) return state;

  return { ...state, words: state.words.slice(0, -1) };
}

export function revealWortleiterSolution(puzzle: WortleiterPuzzle, state: WortleiterState): WortleiterState {
  return {
    ...state,
    words: puzzle.solution.map(normalizeWortleiterWord),
    status: "revealed"
  };
}

export function getWortleiterHintWord(puzzle: WortleiterPuzzle, state: WortleiterState): string | null {
  if (state.status !== "playing") return null;
  const start = normalizeWortleiterWord(state.words[state.words.length - 1] ?? puzzle.startWord);
  const target = normalizeWortleiterWord(puzzle.targetWord);
  const used = new Set(state.words.map(normalizeWortleiterWord));
  const queue: string[][] = [[start]];
  const seen = new Set([start]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const word = path[path.length - 1];
    if (word === target) return path[1] ?? null;

    for (const neighbor of getWortleiterNeighbors(word, getHintBuckets())) {
      if (seen.has(neighbor) || used.has(neighbor)) continue;
      seen.add(neighbor);
      queue.push([...path, neighbor]);
    }
  }

  return null;
}

export function applyWortleiterHint(puzzle: WortleiterPuzzle, state: WortleiterState): WortleiterState {
  const word = getWortleiterHintWord(puzzle, state);
  if (!word) return state;

  return { ...state, words: [...state.words, word], status: word === normalizeWortleiterWord(puzzle.targetWord) ? "won" : "playing" };
}

export function getWortleiterRating(puzzle: WortleiterPuzzle, state: WortleiterState): string {
  const steps = Math.max(0, state.words.length - 1);
  if (steps <= puzzle.optimalSteps) return "★★★";
  if (steps === puzzle.optimalSteps + 1) return "★★";
  return "★";
}
