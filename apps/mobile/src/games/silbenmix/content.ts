import type { SilbenmixGeneratedPuzzle, SilbenmixPuzzle } from "./types";

declare const require: (path: string) => unknown;

export const SILBENMIX_CONTENT_VERSION = 1;
const generatedContent = require("./generated/puzzles.json") as { generatedSilbenmixWords: readonly Omit<SilbenmixPuzzle["targets"][number], "id">[]; generatedSilbenmixPuzzles: readonly SilbenmixGeneratedPuzzle[] };
const generatedSilbenmixWords = generatedContent.generatedSilbenmixWords;
export const silbenmixPuzzleCandidates = generatedContent.generatedSilbenmixPuzzles;

export function materializeSilbenmixPuzzle(candidate: SilbenmixGeneratedPuzzle, id = candidate.id): SilbenmixPuzzle {
  const targets = candidate.targetIndexes.map((wordIndex, targetIndex) => {
    const word = generatedSilbenmixWords[wordIndex];
    if (!word) throw new Error(`Missing Silbenmix word ${wordIndex}.`);
    return { id: `word-${targetIndex + 1}`, word: word.word, syllables: [...word.syllables] };
  });
  const syllables = targets.flatMap((target) => target.syllables);
  return {
    id,
    version: candidate.version,
    difficulty: candidate.difficulty,
    targets,
    tiles: candidate.tileOrder.map((syllableIndex, tileIndex) => ({ id: `tile-${tileIndex + 1}`, syllable: syllables[syllableIndex] ?? "" })),
    syllableCount: candidate.syllableCount,
  };
}
