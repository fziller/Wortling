import { HINT_MAX_BALANCE, HINT_REGENERATION_MS, type HintWallet } from "./types";

// Pure helpers – no AsyncStorage, easy to test.
export function canConsumeHint(wallet: HintWallet): boolean {
  return wallet.balance > 0;
}

export function regenerateHints(wallet: HintWallet, now = Date.now(), intervalMs = HINT_REGENERATION_MS): HintWallet {
  if (wallet.balance >= HINT_MAX_BALANCE) return { ...wallet, balance: HINT_MAX_BALANCE, nextRegenerationAt: null };
  const nextAt = wallet.nextRegenerationAt ?? now + intervalMs;
  if (now < nextAt) return { ...wallet, nextRegenerationAt: nextAt };

  const regenerated = Math.floor((now - nextAt) / intervalMs) + 1;
  const balance = Math.min(HINT_MAX_BALANCE, wallet.balance + regenerated);
  return {
    ...wallet,
    balance,
    totalEarned: wallet.totalEarned + (balance - wallet.balance),
    nextRegenerationAt: balance >= HINT_MAX_BALANCE ? null : nextAt + regenerated * intervalMs,
  };
}

export function nextHintInMs(wallet: HintWallet, now = Date.now(), intervalMs = HINT_REGENERATION_MS): number | null {
  const current = regenerateHints(wallet, now, intervalMs);
  return current.nextRegenerationAt === null ? null : Math.max(0, current.nextRegenerationAt - now);
}

export function fullHintsAt(wallet: HintWallet, now = Date.now(), intervalMs = HINT_REGENERATION_MS): number | null {
  const current = regenerateHints(wallet, now, intervalMs);
  if (current.balance >= HINT_MAX_BALANCE) return null;
  return (current.nextRegenerationAt ?? now) + (HINT_MAX_BALANCE - current.balance - 1) * intervalMs;
}

export function consumeHint(wallet: HintWallet, now = Date.now(), intervalMs = HINT_REGENERATION_MS): HintWallet {
  const current = regenerateHints(wallet, now, intervalMs);
  if (current.balance <= 0) return current;
  return {
    ...current,
    balance: current.balance - 1,
    nextRegenerationAt: current.nextRegenerationAt ?? now + intervalMs,
    totalSpent: current.totalSpent + 1,
  };
}

// Called on each won round. Returns updated wallet + whether a hint was granted.
export function earnHintOnWin(wallet: HintWallet, intervalMs = HINT_REGENERATION_MS): { wallet: HintWallet; granted: boolean } {
  return { wallet: regenerateHints(wallet, Date.now(), intervalMs), granted: false };
}

export function winsUntilNextHint(wallet: HintWallet): number {
  return canConsumeHint(regenerateHints(wallet)) ? 0 : 1;
}
