import AsyncStorage from "@react-native-async-storage/async-storage";

import { HINT_STORAGE_KEY, HINT_STORAGE_VERSION, HINT_MAX_BALANCE, HINT_REGENERATION_MS, type HintWallet } from "./types";

function defaultWallet(): HintWallet {
  return {
    version: HINT_STORAGE_VERSION,
    balance: 0,
    nextRegenerationAt: Date.now() + HINT_REGENERATION_MS,
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
  const winsSinceLastHint = 0;
  const nextRegenerationAt = balance >= HINT_MAX_BALANCE
    ? null
    : typeof r.nextRegenerationAt === "number" && Number.isFinite(r.nextRegenerationAt)
      ? Math.floor(r.nextRegenerationAt)
      : Date.now() + HINT_REGENERATION_MS;
  const totalEarned = typeof r.totalEarned === "number" ? Math.max(0, Math.floor(r.totalEarned)) : 0;
  const totalSpent = typeof r.totalSpent === "number" ? Math.max(0, Math.floor(r.totalSpent)) : 0;
  return { version: HINT_STORAGE_VERSION, balance, nextRegenerationAt, winsSinceLastHint, totalEarned, totalSpent };
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
