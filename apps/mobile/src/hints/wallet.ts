import { HINT_MAX_BALANCE, HINT_REGENERATION_MS, type HintWallet } from "./types";

// Pure helpers – no AsyncStorage, easy to test.
export function canConsumeHint(wallet: HintWallet): boolean {
  return wallet.balance > 0;
}

export function regenerateHints(wallet: HintWallet, now = Date.now()): HintWallet {
  if (wallet.balance >= HINT_MAX_BALANCE) return { ...wallet, balance: HINT_MAX_BALANCE, nextRegenerationAt: null };
  const nextAt = wallet.nextRegenerationAt ?? now + HINT_REGENERATION_MS;
  if (now < nextAt) return { ...wallet, nextRegenerationAt: nextAt };

  const regenerated = Math.floor((now - nextAt) / HINT_REGENERATION_MS) + 1;
  const balance = Math.min(HINT_MAX_BALANCE, wallet.balance + regenerated);
  return {
    ...wallet,
    balance,
    totalEarned: wallet.totalEarned + (balance - wallet.balance),
    nextRegenerationAt: balance >= HINT_MAX_BALANCE ? null : nextAt + regenerated * HINT_REGENERATION_MS,
  };
}

export function nextHintInMs(wallet: HintWallet, now = Date.now()): number | null {
  const current = regenerateHints(wallet, now);
  return current.nextRegenerationAt === null ? null : Math.max(0, current.nextRegenerationAt - now);
}

export function fullHintsAt(wallet: HintWallet, now = Date.now()): number | null {
  const current = regenerateHints(wallet, now);
  if (current.balance >= HINT_MAX_BALANCE) return null;
  return (current.nextRegenerationAt ?? now) + (HINT_MAX_BALANCE - current.balance - 1) * HINT_REGENERATION_MS;
}

export function consumeHint(wallet: HintWallet, now = Date.now()): HintWallet {
  const current = regenerateHints(wallet, now);
  if (current.balance <= 0) return current;
  return {
    ...current,
    balance: current.balance - 1,
    nextRegenerationAt: current.nextRegenerationAt ?? now + HINT_REGENERATION_MS,
    totalSpent: current.totalSpent + 1,
  };
}

// Called on each won round. Returns updated wallet + whether a hint was granted.
export function earnHintOnWin(wallet: HintWallet): { wallet: HintWallet; granted: boolean } {
  return { wallet: regenerateHints(wallet), granted: false };
}

export function winsUntilNextHint(wallet: HintWallet): number {
  return canConsumeHint(regenerateHints(wallet)) ? 0 : 1;
}
