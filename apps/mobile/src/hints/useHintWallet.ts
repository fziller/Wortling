import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

import { loadHintWallet, saveHintWallet } from "./storage";
import { canConsumeHint, consumeHint, earnHintOnWin, fullHintsAt, nextHintInMs, regenerateHints } from "./wallet";
import type { HintWallet } from "./types";
import { createDefaultWallet } from "./storage";
import { loadDebugHintRegenerationMs } from "./debugSettings";
import { scheduleHintWalletFullReminder } from "@/notifications/scheduler";
import { syncHintWalletFullReminder } from "./reminder";

export function useHintWallet() {
  const [wallet, setWallet] = useState<HintWallet>(() => createDefaultWallet());
  const [loaded, setLoaded] = useState(false);
  const [regenerationMs, setRegenerationMs] = useState<number | null>(null);

  useEffect(() => {
    syncHintWalletFullReminder().then(({ wallet: next, intervalMs }) => {
      setWallet(next);
      setRegenerationMs(intervalMs);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  // reload when app comes to foreground (multi-screen consistency)
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") syncHintWalletFullReminder().then(({ wallet: next, intervalMs }) => {
        setWallet(next);
        setRegenerationMs(intervalMs);
      }).catch(() => {});
    });
    return () => sub.remove();
  }, []);

  const persist = useCallback(async (next: HintWallet, intervalMs: number) => {
    setWallet(next);
    await saveHintWallet(next);
    scheduleHintWalletFullReminder(fullHintsAt(next, Date.now(), intervalMs)).catch(() => {});
  }, []);

  const tryConsume = useCallback(async (): Promise<boolean> => {
    const [current, intervalMs] = await Promise.all([loadHintWallet(), loadDebugHintRegenerationMs()]);
    const regenerated = regenerateHints(current, Date.now(), intervalMs);
    if (!canConsumeHint(regenerated)) return false;
    const next = consumeHint(regenerated, Date.now(), intervalMs);
    await persist(next, intervalMs);
    return true;
  }, [persist]);

  const onWin = useCallback(async (): Promise<boolean> => {
    const [current, intervalMs] = await Promise.all([loadHintWallet(), loadDebugHintRegenerationMs()]);
    const { wallet: next, granted } = earnHintOnWin(current, intervalMs);
    if (granted || next.winsSinceLastHint !== current.winsSinceLastHint || next.balance !== current.balance) {
      await persist(next, intervalMs);
    }
    return granted;
  }, [persist]);

  const refresh = useCallback(async () => {
    const [current, intervalMs] = await Promise.all([loadHintWallet(), loadDebugHintRegenerationMs()]);
    const w = regenerateHints(current, Date.now(), intervalMs);
    setWallet(w);
    setRegenerationMs(intervalMs);
    await saveHintWallet(w);
    scheduleHintWalletFullReminder(fullHintsAt(w, Date.now(), intervalMs)).catch(() => {});
  }, []);

  const intervalMs = regenerationMs ?? undefined;
  return { wallet, loaded, canConsume: canConsumeHint(wallet), nextHintInMs: nextHintInMs(wallet, Date.now(), intervalMs), tryConsume, onWin, refresh };
}
