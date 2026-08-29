import AsyncStorage from "@react-native-async-storage/async-storage";

import { HINT_STORAGE_KEY, HINT_STORAGE_VERSION, HINT_MAX_BALANCE, HINT_WINS_PER_HINT, type HintWallet } from "./types";

function defaultWallet(): HintWallet {
  return {
    version: HINT_STORAGE_VERSION,
    balance: 0,
    winsSinceLastHint: 0,
    totalEarned: 0,
    totalSpent: 0,
  };
}

function normalizeWallet(raw: unknown): HintWallet {
  const fallback = defaultWallet();
  if (!raw || typeof raw !== "object") return fallback;
  const r = raw as Record<string, unknown>;
  const balance = typeof r.balance === "number" ? Math.max(0, Math.min(HINT_MAX_BALANCE, Math.floor(r.balance))) : 0;
  const winsSinceLastHint =
    typeof r.winsSinceLastHint === "number" ? Math.max(0, Math.min(HINT_WINS_PER_HINT - 1, Math.floor(r.winsSinceLastHint))) : 0;
  const totalEarned = typeof r.totalEarned === "number" ? Math.max(0, Math.floor(r.totalEarned)) : 0;
  const totalSpent = typeof r.totalSpent === "number" ? Math.max(0, Math.floor(r.totalSpent)) : 0;
  return { version: HINT_STORAGE_VERSION, balance, winsSinceLastHint, totalEarned, totalSpent };
}

export async function loadHintWallet(): Promise<HintWallet> {
  try {
    const raw = await AsyncStorage.getItem(HINT_STORAGE_KEY);
    if (!raw) return defaultWallet();
    return normalizeWallet(JSON.parse(raw));
  } catch {
    return defaultWallet();
  }
}

export async function saveHintWallet(wallet: HintWallet): Promise<void> {
  try {
    await AsyncStorage.setItem(HINT_STORAGE_KEY, JSON.stringify(wallet));
  } catch {
    // offline-first: must never crash gameplay
  }
}

export function createDefaultWallet(): HintWallet {
  return defaultWallet();
}
