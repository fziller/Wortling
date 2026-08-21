import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "wortkniff:daily-streak";

export type DailyStreak = {
  current: number;
  best: number;
  lastCompletedDateKey?: string;
};

const DEFAULT_STREAK: DailyStreak = {
  current: 0,
  best: 0,
};

export async function loadDailyStreak(): Promise<DailyStreak> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return normalizeDailyStreak(raw ? JSON.parse(raw) : null);
  } catch {
    return DEFAULT_STREAK;
  }
}

export async function saveDailyStreak(streak: DailyStreak): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeDailyStreak(streak)));
  } catch {
    // Streaks are cosmetic; gameplay must continue offline even if storage fails.
  }
}

export async function completeDailyStreak(dateKey: string): Promise<DailyStreak> {
  const current = await loadDailyStreak();
  const next = updateDailyStreak(current, dateKey);
  await saveDailyStreak(next);

  return next;
}

export function updateDailyStreak(streak: DailyStreak, completedDateKey: string): DailyStreak {
  const current = normalizeDailyStreak(streak);

  if (current.lastCompletedDateKey === completedDateKey) {
    return current;
  }

  const nextCurrent = getPreviousDateKey(completedDateKey) === current.lastCompletedDateKey
    ? current.current + 1
    : 1;

  return {
    current: nextCurrent,
    best: Math.max(current.best, nextCurrent),
    lastCompletedDateKey: completedDateKey,
  };
}

function normalizeDailyStreak(value: unknown): DailyStreak {
  if (!value || typeof value !== "object") return DEFAULT_STREAK;

  const streak = value as Partial<DailyStreak>;
  const current = Number.isFinite(streak.current) ? Math.max(0, Math.floor(streak.current ?? 0)) : 0;
  const best = Number.isFinite(streak.best) ? Math.max(0, Math.floor(streak.best ?? 0)) : 0;

  return {
    current,
    best: Math.max(best, current),
    lastCompletedDateKey: typeof streak.lastCompletedDateKey === "string" ? streak.lastCompletedDateKey : undefined,
  };
}

function getPreviousDateKey(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);

  return date.toISOString().slice(0, 10);
}
