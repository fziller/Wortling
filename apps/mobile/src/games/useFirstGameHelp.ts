import { useCallback, useEffect, useRef, useState } from "react";

import { hasSeenGameHelp, markGameHelpSeen } from "@/onboarding/gameHelpStorage";
import { hasStartedGame } from "@/stats/repository";

type UseFirstGameHelpInput = {
  enabled: boolean;
  gameId: string;
  onAutomaticOpen?: () => void;
};

export function useFirstGameHelp({ enabled, gameId, onAutomaticOpen }: UseFirstGameHelpInput) {
  const [visible, setVisible] = useState(false);
  const automaticOpenRef = useRef(onAutomaticOpen);

  useEffect(() => {
    automaticOpenRef.current = onAutomaticOpen;
  }, [onAutomaticOpen]);

  useEffect(() => {
    if (!enabled) return;

    let active = true;

    Promise.all([hasSeenGameHelp(gameId), hasStartedGame(gameId)]).then(([hasSeenHelp, hasPlayed]) => {
      if (!active || hasSeenHelp || hasPlayed) return;

      setVisible(true);
      automaticOpenRef.current?.();
    }).catch(() => {
      // Stats/storage are best-effort. Do not interrupt gameplay if either read fails.
    });

    return () => {
      active = false;
    };
  }, [enabled, gameId]);

  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => {
    setVisible(false);
    void markGameHelpSeen(gameId);
  }, [gameId]);

  return { close, open, visible };
}
