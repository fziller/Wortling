import { useCallback, useRef } from "react";

import { captureEvent, type AnalyticsClient } from "./events";

export function useGameStarted(client: AnalyticsClient, gameId: string, dateKey: string) {
  const startedRounds = useRef(new Set<string>());

  return useCallback((puzzleId: string) => {
    const roundId = `${dateKey}:${puzzleId}`;
    if (startedRounds.current.has(roundId)) return;

    startedRounds.current.add(roundId);
    captureEvent(client, "game_started", { gameId, dateKey });
  }, [client, dateKey, gameId]);
}
