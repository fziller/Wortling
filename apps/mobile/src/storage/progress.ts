export type StoredProgress = {
  gameId: string;
  dateKey: string;
  guesses: string[];
  completed: boolean;
};

export async function loadProgress(): Promise<StoredProgress | null> {
  return null;
}

export async function saveProgress(_progress: StoredProgress): Promise<void> {
  // Storage lands after the first play loop; keeping the contract now avoids UI rewrites.
}
