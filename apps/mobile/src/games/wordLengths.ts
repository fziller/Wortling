export type SupportedWordLength = 4 | 5 | 6 | 7;

export type WordsByLength = Partial<Record<SupportedWordLength, readonly string[]>>;
export type WordLengthWeight = { length: SupportedWordLength; weight: number };

export const supportedWordLengths = [4, 5, 6, 7] as const;

export const defaultWordLengthWeights = [
  { length: 5, weight: 45 },
  { length: 6, weight: 35 },
  { length: 7, weight: 20 },
] as const satisfies readonly WordLengthWeight[];

export function isSupportedWordLength(value: unknown): value is SupportedWordLength {
  return value === 4 || value === 5 || value === 6 || value === 7;
}

export function getWordLength(word: string): number {
  return Array.from(word).length;
}

export function pickRandomWordLength(availableLengths: readonly SupportedWordLength[] = [5, 6, 7], weights: readonly WordLengthWeight[] = defaultWordLengthWeights): SupportedWordLength {
  const available = new Set(availableLengths);
  const options = weights.filter((option) => available.has(option.length));
  const total = options.reduce((sum, option) => sum + option.weight, 0);
  let roll = Math.random() * total;

  for (const option of options) {
    roll -= option.weight;
    if (roll < 0) return option.length;
  }

  return options[options.length - 1]?.length ?? 5;
}

export function pickRandomTargetWord(targetsByLength: WordsByLength, previousAnswer?: string, weights?: readonly WordLengthWeight[]) {
  const validTargetsByLength = Object.fromEntries(
    supportedWordLengths.map((length) => [length, (targetsByLength[length] ?? []).filter((word) => getWordLength(word) === length)]),
  ) as Record<SupportedWordLength, string[]>;
  const availableLengths = supportedWordLengths.filter((length) => validTargetsByLength[length].length > 0);
  const wordLength = pickRandomWordLength(availableLengths, weights);
  const targets = validTargetsByLength[wordLength];
  const options = targets.filter((word) => word !== previousAnswer);
  const words = options.length > 0 ? options : targets;
  const answer = words[Math.floor(Math.random() * words.length)];

  if (!answer) {
    throw new Error("No target words available for supported word lengths.");
  }

  return { answer, wordLength };
}

export function groupWordsByLength(words: readonly string[]): WordsByLength {
  const grouped: Record<SupportedWordLength, string[]> = { 4: [], 5: [], 6: [], 7: [] };

  for (const word of words) {
    const length = getWordLength(word);
    if (isSupportedWordLength(length)) grouped[length].push(word);
  }

  return grouped;
}
