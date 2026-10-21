import { scheduleHintWalletFullReminder } from "@/notifications/scheduler";

import { loadDebugHintRegenerationMs } from "./debugSettings";
import { loadHintWallet, saveHintWallet } from "./storage";
import { fullHintsAt, regenerateHints } from "./wallet";

/** Restores the wallet's time-based balance and keeps its native reminder current. */
export async function syncHintWalletFullReminder() {
  const [wallet, intervalMs] = await Promise.all([loadHintWallet(), loadDebugHintRegenerationMs()]);
  const next = regenerateHints(wallet, Date.now(), intervalMs);

  await saveHintWallet(next);
  await scheduleHintWalletFullReminder(fullHintsAt(next, Date.now(), intervalMs)).catch(() => {});

  return { intervalMs, wallet: next };
}
