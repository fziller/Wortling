import { anagrammSolutionsBySignature } from "./content";
import type { AnagrammPuzzle, AnagrammState, AnagrammSubmitResult, AnagrammWordLength } from "./types";

export function normalizeAnagrammWord(value: string): string {
  return value.normalize("NFC").trim().toLocaleLowerCase("de-DE");
}

export function getAnagrammSignature(value: string): string {
  return Array.from(normalizeAnagrammWord(value)).sort(new Intl.Collator("de-DE").compare).join("");
}

export function createAnagrammState(puzzle: AnagrammPuzzle): AnagrammState {
  return {
    puzzleId: puzzle.id,
    guesses: [],
    placedTileIndices: Array.from({ length: puzzle.wordLength }, () => null),
    fixedIndices: [],
    status: "playing",
  };
}

export function getAnagrammSolutions(wordLength: AnagrammWordLength, word: string): readonly string[] {
  return anagrammSolutionsBySignature[wordLength]?.[getAnagrammSignature(word)] ?? [];
}

export function shuffleAnagrammLetters(answer: string, random = Math.random): string[] {
  const letters = Array.from(normalizeAnagrammWord(answer));
  const original = letters.join("");
  if (new Set(letters).size < 2) return letters;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const shuffled = [...letters];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    if (shuffled.join("") !== original) return shuffled;
  }

  const first = letters.findIndex((letter) => letter !== letters[0]);
  return [...letters.slice(first), ...letters.slice(0, first)];
}

export function placeAnagrammTile(puzzle: AnagrammPuzzle, state: AnagrammState, tileIndex: number, preferredSlotIndex?: number): AnagrammState {
  if (state.status !== "playing" || tileIndex < 0 || tileIndex >= puzzle.shuffledLetters.length || state.placedTileIndices.includes(tileIndex)) return state;
  const slotIndex = preferredSlotIndex === undefined
    ? state.placedTileIndices.findIndex((tile, index) => tile === null && !state.fixedIndices.includes(index))
    : state.placedTileIndices[preferredSlotIndex] === null && !state.fixedIndices.includes(preferredSlotIndex) ? preferredSlotIndex : -1;
  if (slotIndex === -1) return state;
  const placedTileIndices = [...state.placedTileIndices];
  placedTileIndices[slotIndex] = tileIndex;
  return { ...state, placedTileIndices };
}

export function removeAnagrammTile(state: AnagrammState, slotIndex: number): AnagrammState {
  if (state.status !== "playing" || state.fixedIndices.includes(slotIndex) || state.placedTileIndices[slotIndex] === null) return state;
  const placedTileIndices = [...state.placedTileIndices];
  placedTileIndices[slotIndex] = null;
  return { ...state, placedTileIndices };
}

export function moveAnagrammTile(state: AnagrammState, fromSlotIndex: number, toSlotIndex: number): AnagrammState {
  if (state.status !== "playing" || fromSlotIndex === toSlotIndex || state.fixedIndices.includes(fromSlotIndex) || state.fixedIndices.includes(toSlotIndex)) return state;
  const tileIndex = state.placedTileIndices[fromSlotIndex];
  if (tileIndex === null || fromSlotIndex < 0 || toSlotIndex < 0 || fromSlotIndex >= state.placedTileIndices.length || toSlotIndex >= state.placedTileIndices.length) return state;
  const placedTileIndices = [...state.placedTileIndices];
  placedTileIndices[fromSlotIndex] = placedTileIndices[toSlotIndex];
  placedTileIndices[toSlotIndex] = tileIndex;
  return { ...state, placedTileIndices };
}

export function getAnagrammDraft(puzzle: AnagrammPuzzle, state: AnagrammState): string {
  return state.placedTileIndices.map((tileIndex) => tileIndex === null ? "" : puzzle.shuffledLetters[tileIndex] ?? "").join("");
}

export function submitAnagrammGuess(puzzle: AnagrammPuzzle, state: AnagrammState, options: { ignoreAttemptLimit?: boolean } = {}): AnagrammSubmitResult {
  if (state.status !== "playing") return { ok: false, state, reason: "Diese Runde ist schon beendet." };
  if (state.placedTileIndices.some((index) => index === null)) return { ok: false, state, reason: "Setze zuerst alle Buchstaben ein." };

  const guess = getAnagrammDraft(puzzle, state);
  if (state.guesses.includes(guess)) return { ok: false, state, reason: "Schon versucht." };
  const won = puzzle.acceptedAnswers.includes(guess);
  const lost = !options.ignoreAttemptLimit && !won && state.guesses.length + 1 >= puzzle.maxAttempts;
  return {
    ok: true,
    guess,
    state: {
      ...state,
      guesses: [...state.guesses, guess],
      placedTileIndices: state.placedTileIndices.map((tileIndex, index) => state.fixedIndices.includes(index) ? tileIndex : null),
      status: won ? "won" : lost ? "lost" : "playing",
    },
  };
}

export function getAnagrammHintPosition(puzzle: AnagrammPuzzle, state: AnagrammState, random = Math.random): number | null {
  const answer = Array.from(puzzle.answer);
  const positions = answer.flatMap((letter, index) => {
    const placed = state.placedTileIndices[index];
    const solved = placed !== null && puzzle.shuffledLetters[placed] === letter;
    return !state.fixedIndices.includes(index) && !solved ? [index] : [];
  });
  return positions.length ? positions[Math.floor(random() * positions.length)] : null;
}

export function applyAnagrammHint(puzzle: AnagrammPuzzle, state: AnagrammState, random = Math.random): AnagrammState {
  if (state.status !== "playing") return state;
  const position = getAnagrammHintPosition(puzzle, state, random);
  if (position === null) return state;

  const placedTileIndices = [...state.placedTileIndices];
  placedTileIndices[position] = null;
  const usedTiles = new Set(placedTileIndices.filter((index): index is number => index !== null));
  let tileIndex = puzzle.shuffledLetters.findIndex((letter, index) => !usedTiles.has(index) && letter === Array.from(puzzle.answer)[position]);
  if (tileIndex === -1) {
    const occupiedSlot = placedTileIndices.findIndex((index, slot) => index !== null && !state.fixedIndices.includes(slot) && puzzle.shuffledLetters[index] === Array.from(puzzle.answer)[position]);
    if (occupiedSlot !== -1) {
      tileIndex = placedTileIndices[occupiedSlot] ?? -1;
      placedTileIndices[occupiedSlot] = null;
    }
  }
  if (tileIndex === -1) return state;
  placedTileIndices[position] = tileIndex;
  return { ...state, placedTileIndices, fixedIndices: [...state.fixedIndices, position] };
}

export function revealAnagrammSolution(state: AnagrammState): AnagrammState {
  return { ...state, status: "revealed" };
}
