import type { WortleiterDifficulty, WortleiterPuzzle } from "./types";

export function normalizeWortleiterWord(value: string): string {
  return value.normalize("NFC").trim().toLocaleLowerCase("de-DE");
}

export function getWordChars(word: string): string[] {
  return Array.from(normalizeWortleiterWord(word));
}

export function isValidTransition(from: string, to: string): boolean {
  const fromChars = getWordChars(from);
  const toChars = getWordChars(to);

  if (fromChars.length !== toChars.length) return false;

  let differences = 0;
  for (let index = 0; index < fromChars.length; index += 1) {
    if (fromChars[index] !== toChars[index]) differences += 1;
    if (differences > 1) return false;
  }

  return differences === 1;
}

export function buildPatternBuckets(words: readonly string[]): Map<string, string[]> {
  const buckets = new Map<string, string[]>();

  for (const word of words) {
    const chars = getWordChars(word);
    for (let index = 0; index < chars.length; index += 1) {
      const pattern = `${chars.slice(0, index).join("")}_${chars.slice(index + 1).join("")}`;
      buckets.set(pattern, [...buckets.get(pattern) ?? [], word]);
    }
  }

  return buckets;
}

export function getWortleiterNeighbors(word: string, buckets: Map<string, string[]>): string[] {
  const chars = getWordChars(word);
  const neighbors = new Set<string>();

  for (let index = 0; index < chars.length; index += 1) {
    const pattern = `${chars.slice(0, index).join("")}_${chars.slice(index + 1).join("")}`;
    for (const neighbor of buckets.get(pattern) ?? []) {
      if (neighbor !== word && isValidTransition(word, neighbor)) neighbors.add(neighbor);
    }
  }

  return [...neighbors];
}

export function findShortestPath(start: string, target: string, buckets: Map<string, string[]>): string[] | null {
  const normalizedStart = normalizeWortleiterWord(start);
  const normalizedTarget = normalizeWortleiterWord(target);
  const queue: string[][] = [[normalizedStart]];
  const seen = new Set([normalizedStart]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const word = path[path.length - 1];

    if (word === normalizedTarget) return path;

    for (const neighbor of getWortleiterNeighbors(word, buckets)) {
      if (seen.has(neighbor)) continue;
      seen.add(neighbor);
      queue.push([...path, neighbor]);
    }
  }

  return null;
}

export function getWortleiterDifficulty(optimalSteps: number): WortleiterDifficulty {
  if (optimalSteps <= 3) return "easy";
  if (optimalSteps <= 5) return "medium";
  return "hard";
}

export function isSuitableWortleiterPath(path: readonly string[] | null): path is string[] {
  if (!path) return false;
  const steps = path.length - 1;

  return steps >= 3 && steps <= 6;
}

export function createWortleiterPuzzle(id: string, version: number, solution: readonly string[]): WortleiterPuzzle {
  const startWord = solution[0];
  const targetWord = solution[solution.length - 1];
  const optimalSteps = solution.length - 1;

  return {
    id,
    version,
    startWord,
    targetWord,
    wordLength: getWordChars(startWord).length,
    optimalSteps,
    difficulty: getWortleiterDifficulty(optimalSteps),
    solution: [...solution]
  };
}
