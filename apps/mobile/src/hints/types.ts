// Hint wallet: global across all games, starts full and regenerates over time.
export const HINT_MAX_BALANCE = 3;
export const HINT_STORAGE_KEY = "wortkniff:hints:wallet";
export const HINT_STORAGE_VERSION = 2;
export const HINT_REGENERATION_MS = 30 * 60 * 1000;

export type HintWallet = {
  version: number;
  balance: number; // 0..HINT_MAX_BALANCE
  /** Epoch milliseconds when the next hint is regenerated; null while full. */
  nextRegenerationAt: number | null;
  // Kept only to read wallets saved before time regeneration shipped.
  winsSinceLastHint: number;
  totalEarned: number;
  totalSpent: number;
};

export type HintPolicy = "earned" | "ads" | "purchase" | "hybrid";

// Ad-ready abstraction: later flip policy via env/config without touching game code.
export type HintGrantResult =
  | { ok: true; reason: "earned" | "ad" | "purchase" }
  | { ok: false; reason: "max_balance" | "ad_failed" | "not_available" };

export type HintConsumeResult =
  | { ok: true }
  | { ok: false; reason: "no_hints" | "already_revealed" };
