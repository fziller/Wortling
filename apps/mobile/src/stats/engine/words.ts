export type WordCount = { word: string; count: number };

export type WordStats = {
  totalValidGuesses: number;
  distinctWords: number;
  distinctLetters: number;
  topWords: WordCount[];
  topLetters: WordCount[];
};

// ponytail: top-N lists computed over all rows; fine for years of daily play,
// switch to SQL aggregation if guess volume ever becomes noticeable.
export function computeWordStats(guesses: readonly { normalizedWord: string }[], topLimit = 5): WordStats {
  const wordCounts = new Map<string, number>();
  const letterCounts = new Map<string, number>();

  for (const guess of guesses) {
    wordCounts.set(guess.normalizedWord, (wordCounts.get(guess.normalizedWord) ?? 0) + 1);

    for (const letter of guess.normalizedWord) {
      letterCounts.set(letter, (letterCounts.get(letter) ?? 0) + 1);
    }
  }

  return {
    totalValidGuesses: guesses.length,
    distinctWords: wordCounts.size,
    distinctLetters: letterCounts.size,
    topWords: topEntries(wordCounts, topLimit),
    topLetters: topEntries(letterCounts, topLimit),
  };
}

function topEntries(counts: Map<string, number>, limit: number): WordCount[] {
  return [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || (a.word < b.word ? -1 : a.word > b.word ? 1 : 0))
    .slice(0, limit);
}
