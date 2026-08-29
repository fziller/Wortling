import { HINT_MAX_BALANCE, HINT_WINS_PER_HINT, type HintWallet } from "./types";

// Pure helpers – no AsyncStorage, easy to test.
export function canConsumeHint(wallet: HintWallet): boolean {
  return wallet.balance > 0;
}

export function consumeHint(wallet: HintWallet): HintWallet {
  if (wallet.balance <= 0) return wallet;
  return {
    ...wallet,
    balance: wallet.balance - 1,
    totalSpent: wallet.totalSpent + 1,
  };
}

// Called on each won round. Returns updated wallet + whether a hint was granted.
export function earnHintOnWin(wallet: HintWallet): { wallet: HintWallet; granted: boolean } {
  const nextWins = wallet.winsSinceLastHint + 1;
  if (nextWins >= HINT_WINS_PER_HINT) {
    // grant if not at cap, otherwise keep streak reset but no grant
    if (wallet.balance >= HINT_MAX_BALANCE) {
      return {
        wallet: { ...wallet, winsSinceLastHint: 0 },
        granted: false,
      };
    }
    return {
      wallet: {
        ...wallet,
        balance: wallet.balance + 1,
        winsSinceLastHint: 0,
        totalEarned: wallet.totalEarned + 1,
      },
      granted: true,
    };
  }
  return { wallet: { ...wallet, winsSinceLastHint: nextWins }, granted: false };
}

export function winsUntilNextHint(wallet: HintWallet): number {
  return HINT_WINS_PER_HINT - wallet.winsSinceLastHint;
}
