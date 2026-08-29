import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

import { loadHintWallet, saveHintWallet } from "./storage";
import { canConsumeHint, consumeHint, earnHintOnWin } from "./wallet";
import type { HintWallet } from "./types";
import { createDefaultWallet } from "./storage";

export function useHintWallet() {
  const [wallet, setWallet] = useState<HintWallet>(() => createDefaultWallet());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadHintWallet().then((w) => {
      setWallet(w);
      setLoaded(true);
    });
  }, []);

  // reload when app comes to foreground (multi-screen consistency)
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") loadHintWallet().then(setWallet);
    });
    return () => sub.remove();
  }, []);

  const persist = useCallback(async (next: HintWallet) => {
    setWallet(next);
    await saveHintWallet(next);
  }, []);

  const tryConsume = useCallback(async (): Promise<boolean> => {
    const current = await loadHintWallet();
    if (!canConsumeHint(current)) return false;
    const next = consumeHint(current);
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
    const w = await loadHintWallet();
    setWallet(w);
  }, []);

  return { wallet, loaded, canConsume: wallet.balance > 0, tryConsume, onWin, refresh };
}
