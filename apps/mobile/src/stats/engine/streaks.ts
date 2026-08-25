export type StreakSummary = {
  current: number;
  longest: number;
};

function toEpochDay(dateKey: string): number {
  return Math.floor(Date.parse(`${dateKey}T12:00:00.000Z`) / 86_400_000);
}

export function computeStreaks(dateKeys: readonly string[], todayKey: string): StreakSummary {
  const days = new Set(dateKeys.map(toEpochDay));

  let longest = 0;
  let runLength = 0;
  let previousDay = Number.NaN;

  for (const day of [...days].sort((a, b) => a - b)) {
    runLength = day === previousDay + 1 ? runLength + 1 : 1;
    previousDay = day;
    longest = Math.max(longest, runLength);
  }

  let current = 0;
  const today = toEpochDay(todayKey);
  let cursor = days.has(today) ? today : today - 1;

  while (days.has(cursor)) {
    current += 1;
    cursor -= 1;
  }

  return { current, longest };
}
