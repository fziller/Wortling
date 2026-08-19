import * as Notifications from "expo-notifications";

import { games } from "@/games/registry";
import type { StoredProgress } from "@/storage/progress";

export async function updateBadgeCount(
  progressByGame: Record<string, StoredProgress | null>,
): Promise<void> {
  try {
    const openCount = games.filter((game) => {
      const status = progressByGame[game.id]?.status;
      return !status || status === "not_started" || status === "playing";
    }).length;

    await Notifications.setBadgeCountAsync(openCount);
  } catch {
    // Badge count is cosmetic; don't crash.
  }
}
