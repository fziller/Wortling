import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

import { loadHintWallet, saveHintWallet } from "./storage";
import { canConsumeHint, consumeHint, earnHintOnWin, fullHintsAt, nextHintInMs, regenerateHints } from "./wallet";
import type { HintWallet } from "./types";
import { createDefaultWallet } from "./storage";
import { scheduleHintWalletFullReminder } from "@/notifications/scheduler";

export function useHintWallet() {
  const [wallet, setWallet] = useState<HintWallet>(() => createDefaultWallet());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadHintWallet().then(async (w) => {
      const next = regenerateHints(w);
      setWallet(next);
      await saveHintWallet(next);
      scheduleHintWalletFullReminder(fullHintsAt(next)).catch(() => {});
      setLoaded(true);
    });
  }, []);

  // reload when app comes to foreground (multi-screen consistency)
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") loadHintWallet().then(async (w) => {
        const next = regenerateHints(w);
        setWallet(next);
        await saveHintWallet(next);
        scheduleHintWalletFullReminder(fullHintsAt(next)).catch(() => {});
      });
    });
    return () => sub.remove();
  }, []);

  const persist = useCallback(async (next: HintWallet) => {
    setWallet(next);
    await saveHintWallet(next);
    scheduleHintWalletFullReminder(fullHintsAt(next)).catch(() => {});
  }, []);

  const tryConsume = useCallback(async (): Promise<boolean> => {
    const current = await loadHintWallet();
    const regenerated = regenerateHints(current);
    if (!canConsumeHint(regenerated)) return false;
    const next = consumeHint(regenerated);
    await persist(next);
    return true;
  }, [persist]);

  const onWin = useCallback(async (): Promise<boolean> => {
    const current = await loadHintWallet();
    const { wallet: next, granted } = earnHintOnWin(current);
    if (granted || next.winsSinceLastHint !== current.winsSinceLastHint || next.balance !== current.balance) {
      await persist(next);
    }
    return granted;
  }, [persist]);

  const refresh = useCallback(async () => {
    const w = regenerateHints(await loadHintWallet());
    setWallet(w);
    await saveHintWallet(w);
    scheduleHintWalletFullReminder(fullHintsAt(w)).catch(() => {});
  }, []);

  return { wallet, loaded, canConsume: canConsumeHint(wallet), nextHintInMs: nextHintInMs(wallet), tryConsume, onWin, refresh };
}
