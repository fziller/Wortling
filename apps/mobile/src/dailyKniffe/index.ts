import { getBerlinDateKey } from "@/daily/date";
import { hashSeed } from "@/daily/seed";
import type { GameDefinition, GameStatus } from "@/games/types";
import type { StoredProgress } from "@/storage/progress";

export const DAILY_KNIFFE_VERSION = 1;
export const DAILY_KNIFFE_COUNT = 3;

export type DailyKniff = {
  id: string;
  dateKey: string;
  gameId: string;
};

export type DailyKniffeSummary = {
  total: number;
  completed: number;
  isComplete: boolean;
};

export type DailyKniffeDevConfig = {
  seedOverride?: number;
};

type GenerateDailyKniffeOptions = {
  date?: Date;
  dateKey?: string;
  devConfig?: DailyKniffeDevConfig;
  games: readonly GameDefinition[];
  rotationVersion?: number;
};

export function createDailyKniffeSeed(dateKey: string, rotationVersion = DAILY_KNIFFE_VERSION): number {
  return hashSeed(`${dateKey}:daily-kniffe:${rotationVersion}`);
}

export function generateDailyKniffe({
  date = new Date(),
  dateKey = getBerlinDateKey(date),
  devConfig,
  games,
  rotationVersion = DAILY_KNIFFE_VERSION,
}: GenerateDailyKniffeOptions): DailyKniff[] {
  const eligibleGames = games.filter((game) => game.dailyKniffEligible === true);

  if (eligibleGames.length < DAILY_KNIFFE_COUNT && typeof __DEV__ !== "undefined" && __DEV__) {
    console.warn(`Tageskniffe need ${DAILY_KNIFFE_COUNT} eligible games, got ${eligibleGames.length}.`);
  }

  const seed = devConfig?.seedOverride ?? createDailyKniffeSeed(dateKey, rotationVersion);

  return seededShuffle(eligibleGames, seed)
    .slice(0, DAILY_KNIFFE_COUNT)
    .map((game) => ({
      id: `${dateKey}:${game.id}`,
      dateKey,
      gameId: game.id,
    }));
}

export function isDailyKniffCompleted(progress: StoredProgress | null | undefined): boolean {
  return isFinalDailyStatus(progress?.status);
}

export function isFinalDailyStatus(status: GameStatus | null | undefined): boolean {
  return status === "won" || status === "lost" || status === "revealed";
}

export function getDailyKniffeSummary(
  kniffe: readonly DailyKniff[],
  progressByGame: Record<string, StoredProgress | null | undefined>,
): DailyKniffeSummary {
  const completed = kniffe.filter((kniff) => isDailyKniffCompleted(progressByGame[kniff.gameId])).length;

  return {
    total: kniffe.length,
    completed,
    isComplete: kniffe.length > 0 && completed === kniffe.length,
  };
}

function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const shuffled = [...items];
  const random = mulberry32(seed);

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;

  return () => {
    value += 0x6D2B79F5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);

    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}
