import * as Notifications from "expo-notifications";

import { getBerlinDateKey } from "@/daily/date";
import { generateDailyKniffe, getDailyKniffeSummary } from "@/dailyKniffe";
import { games } from "@/games/registry";
import type { StoredProgress } from "@/storage/progress";

export async function updateBadgeCount(
  progressByGame: Record<string, StoredProgress | null>,
  dateKey = getBerlinDateKey(),
  seedOverride?: number,
): Promise<void> {
  try {
    const kniffe = generateDailyKniffe({ dateKey, devConfig: { seedOverride }, games });
    const summary = getDailyKniffeSummary(kniffe, progressByGame);
    const openCount = Math.max(0, summary.total - summary.completed);

    await Notifications.setBadgeCountAsync(openCount);
  } catch {
    // Badge count is cosmetic; don't crash.
  }
}
