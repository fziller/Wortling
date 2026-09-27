import type { WabenwortPuzzle, WabenwortRank, WabenwortState, WabenwortSubmitResult, WabenwortWord } from "./types";

function normalize(value: string): string {
  return value.normalize("NFC").trim().toLocaleLowerCase("de-DE");
}

export function createWabenwortState(puzzle: WabenwortPuzzle): WabenwortState {
  return { puzzleId: puzzle.id, foundWords: [], status: "playing" };
}

export function getWabenwortScore(puzzle: WabenwortPuzzle, state: WabenwortState): number {
  return state.foundWords.reduce((total, word) => total + (getWabenwortWord(puzzle, word)?.score ?? 0), 0);
}

export function getWabenwortWord(puzzle: WabenwortPuzzle, value: string): WabenwortWord | null {
  const word = normalize(value);
  const curated = puzzle.words.find((item) => item.word === word);
  if (curated) return curated;
  if (!puzzle.allowedWords.includes(word)) return null;
  const isPangram = [...new Set(Array.from(word))].sort().join("") === [...puzzle.letters].sort().join("");
  return { word, score: Array.from(word).length === 4 ? 1 : Array.from(word).length + (isPangram ? 7 : 0), isPangram };
}

export function getWabenwortRank(puzzle: WabenwortPuzzle, state: WabenwortState): WabenwortRank {
  const found = state.foundWords.length;
  if (found >= puzzle.goldWords) return "gold";
  if (found >= puzzle.silverWords) return "silber";
  if (found >= puzzle.bronzeWords) return "bronze";
  return "start";
}

export function submitWabenwortWord(puzzle: WabenwortPuzzle, state: WabenwortState, rawWord: string): WabenwortSubmitResult {
  const value = normalize(rawWord);
  if (state.status !== "playing") return { ok: false, state, reason: "Diese Runde ist schon beendet." };
  if (Array.from(value).length < 4) return { ok: false, state, reason: "Wörter brauchen mindestens 4 Buchstaben." };
  if (!value.includes(puzzle.centerLetter)) return { ok: false, state, reason: `Nutze auch ${puzzle.centerLetter.toLocaleUpperCase("de-DE")}.` };
  if (![...value].every((letter) => puzzle.letters.includes(letter))) return { ok: false, state, reason: "Nutze nur Buchstaben aus der Wabe." };
  if (state.foundWords.includes(value)) return { ok: false, state, reason: "Dieses Wort hast du schon gefunden." };
  const word = getWabenwortWord(puzzle, value);
  if (!word) return { ok: false, state, reason: "Unbekanntes Wort." };
  const foundWords = [...state.foundWords, word.word];
  const next = { ...state, foundWords };
  const rank = getWabenwortRank(puzzle, next);
  return { ok: true, word, rank, state: { ...next, status: rank === "gold" ? "won" : "playing" } };
}

export function getWabenwortHint(puzzle: WabenwortPuzzle, state: WabenwortState): WabenwortWord | null {
  const found = new Set(state.foundWords);
  return puzzle.words.filter((item) => !found.has(item.word)).sort((a, b) => b.word.length - a.word.length || b.score - a.score)[0] ?? null;
}

export function applyWabenwortHint(puzzle: WabenwortPuzzle, state: WabenwortState): WabenwortState {
  const word = getWabenwortHint(puzzle, state);
  if (!word) return state;
  const next = { ...state, foundWords: [...state.foundWords, word.word] };
  return { ...next, status: getWabenwortRank(puzzle, next) === "gold" ? "won" : "playing" };
}

export function revealWabenwortSolution(puzzle: WabenwortPuzzle, state: WabenwortState): WabenwortState {
  return { ...state, foundWords: [...state.foundWords], status: "revealed" };
}
