import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "wortkniff:recent-rounds";
const RECENT_ROUND_LIMIT = 10;

let recentByGame: Record<string, string[]> = {};
let hydrated = false;

export async function hydrateRecentRounds(): Promise<void> {
  if (hydrated) return;

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === "object") {
      recentByGame = Object.fromEntries(
        Object.entries(parsed).filter((entry): entry is [string, string[]] => Array.isArray(entry[1]) && entry[1].every((value) => typeof value === "string")),
      );
    }
  } catch {
    recentByGame = {};
  }

  hydrated = true;
}

export function pickFreshRound<T>(gameId: string, pick: () => T, getId: (value: T) => string): T {
  const recent = new Set(recentByGame[gameId] ?? []);
  let fallback = pick();

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const candidate = attempt === 0 ? fallback : pick();
    if (!recent.has(getId(candidate))) {
      rememberRecentRound(gameId, getId(candidate));
      return candidate;
    }
  }

  rememberRecentRound(gameId, getId(fallback));
  return fallback;
}

export function rememberRecentRound(gameId: string, puzzleId: string): void {
  const previous = recentByGame[gameId] ?? [];
  recentByGame = {
    ...recentByGame,
    [gameId]: [puzzleId, ...previous.filter((id) => id !== puzzleId)].slice(0, RECENT_ROUND_LIMIT),
  };

  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recentByGame)).catch(() => {});
}

export function resetRecentRoundsForTests(): void {
  recentByGame = {};
  hydrated = false;
}
