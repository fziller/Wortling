import { useEffect, useState } from "react";

import { generateDailyKniffe, isDailyKniffCompleted } from "@/dailyKniffe";
import { gameRegistry, games } from "@/games/registry";
import { loadProgressForGames } from "@/storage/progress";

export function useNextOpenDailyKniff(currentGameId: string, dateKey: string, currentCompleted: boolean) {
  const [nextRoute, setNextRoute] = useState<string | null>(null);

  useEffect(() => {
    if (!currentCompleted) {
      setNextRoute(null);
      return;
    }

    let mounted = true;
    const dailyKniffe = generateDailyKniffe({ dateKey, games });

    if (!dailyKniffe.some((kniff) => kniff.gameId === currentGameId)) {
      setNextRoute(null);
      return;
    }

    loadProgressForGames(dailyKniffe.map((kniff) => kniff.gameId), dateKey).then((progress) => {
      if (!mounted) return;
      const next = dailyKniffe.find((kniff) => kniff.gameId !== currentGameId && !isDailyKniffCompleted(progress[kniff.gameId]));
      setNextRoute(next ? gameRegistry[next.gameId]?.route ?? null : null);
    }).catch(() => {
      if (mounted) setNextRoute(null);
    });

    return () => {
      mounted = false;
    };
  }, [currentCompleted, currentGameId, dateKey]);

  return nextRoute;
}
