import { getBerlinDateKey } from "@/daily/date";

import { materializeSilbenmixPuzzle, silbenmixPuzzleCandidates } from "./content";
import { createSilbenmixState } from "./engine";
import type { SilbenmixPuzzle } from "./types";

function clonePuzzle(puzzle: SilbenmixPuzzle, id = puzzle.id): SilbenmixPuzzle {
  return {
    ...puzzle,
    id,
    targets: puzzle.targets.map((target) => ({ ...target, syllables: [...target.syllables] })),
    tiles: [...puzzle.tiles],
  };
}

export function createNextSilbenmixGame(previousPuzzleId?: string, dateKey = "Freies Spiel") {
  const options = silbenmixPuzzleCandidates.filter((puzzle) => puzzle.id !== previousPuzzleId);
  const pool = options.length ? options : silbenmixPuzzleCandidates;
  const difficulty = Math.random() < 0.6 ? "medium" : Math.random() < 0.5 ? "easy" : "hard";
  const difficultyPool = pool.filter((puzzle) => puzzle.difficulty === difficulty);
  const source = difficultyPool[Math.floor(Math.random() * difficultyPool.length)] ?? pool[0];
  if (!source) throw new Error("No Silbenmix puzzles available.");
  const puzzle = clonePuzzle(materializeSilbenmixPuzzle(source), dateKey === "Freies Spiel" ? `silbenmix-next-${Date.now()}` : source.id);
  return { dateKey, puzzle, state: createSilbenmixState(puzzle) };
}

export function createDailySilbenmixGame(date = new Date()) {
  // Daily rounds intentionally select randomly once, then AsyncStorage persists that choice.
  return createNextSilbenmixGame(undefined, getBerlinDateKey(date));
}

export function restoreSilbenmixPuzzle(value: unknown): SilbenmixPuzzle | null {
  const puzzle = value as Partial<SilbenmixPuzzle> | null;
  if (!puzzle || typeof puzzle.id !== "string" || !Array.isArray(puzzle.targets) || !Array.isArray(puzzle.tiles) || typeof puzzle.syllableCount !== "number") return null;
  if (!puzzle.targets.every((target) => typeof target?.id === "string" && typeof target.word === "string" && Array.isArray(target.syllables))) return null;
  if (!puzzle.tiles.every((tile) => typeof tile?.id === "string" && typeof tile.syllable === "string")) return null;
  if (puzzle.difficulty !== "easy" && puzzle.difficulty !== "medium" && puzzle.difficulty !== "hard") return null;
  return clonePuzzle({ ...puzzle, version: typeof puzzle.version === "number" ? puzzle.version : 1 } as SilbenmixPuzzle);
}
