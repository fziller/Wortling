// Hint wallet: global across all games, earned by winning rounds.
export const HINT_MAX_BALANCE = 3;
export const HINT_WINS_PER_HINT = 3;
export const HINT_STORAGE_KEY = "wortkniff:hints:wallet";
export const HINT_STORAGE_VERSION = 1;

export type HintWallet = {
  version: number;
  balance: number; // 0..HINT_MAX_BALANCE
  winsSinceLastHint: number; // 0..HINT_WINS_PER_HINT-1
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
