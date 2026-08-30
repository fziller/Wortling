// Central gate for word packs — feature flag + paywall.
// ponytail: one place to flip, no scattered `if (premium)` checks.
// Usage in settings/daily: `canUsePacks = await canUsePacks()` or `isPackGated()` for UI.
// Later: replace mock with real RevenueCat / Play Billing / App Store check.

import AsyncStorage from "@react-native-async-storage/async-storage";

const PREMIUM_STORAGE_KEY = "wortkniff:premium:entitlement";
// Env-driven kill switch — easiest to hide behind flag without code change.
// - EXPO_PUBLIC_PACKS_GATED=true  → packs are premium (gate on)
// - falsy / "false"               → packs are free (gate off) — default for dev
function isPackGatedByEnv(): boolean {
  const v = process.env.EXPO_PUBLIC_PACKS_GATED;
  return v === "true" || v === "1";
}

// Mock entitlement for dev: stored boolean. In prod, query real purchase state here.
export async function hasPremiumAccess(): Promise<boolean> {
  // If not gated, everyone has access — no paywall.
  if (!isPackGatedByEnv()) return true;
  try {
    const raw = await AsyncStorage.getItem(PREMIUM_STORAGE_KEY);
    return raw === "true";
  } catch {
    return false;
  }
}

export function isPackGated(): boolean {
  return isPackGatedByEnv();
}

// For sync UI checks (e.g. hiding section entirely). Async check still needed for entitlement.
export function shouldShowPacksSection(): boolean {
  // If you want to completely hide packs behind a feature flag, add another env check here.
  // For now, section always visible — gated packs show lock/paywall CTA.
  return true;
}

// Dev helpers — toggle mock premium in settings or via console
export async function setMockPremiumEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(PREMIUM_STORAGE_KEY, enabled ? "true" : "false");
  } catch {}
}

export async function getMockPremiumEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(PREMIUM_STORAGE_KEY);
    return raw === "true";
  } catch {
    return false;
  }
}

// Hook-friendly sync variant: reads env only, for initial render before async check.
// Use `hasPremiumAccess()` for authoritative async check.
export function isPremiumMockSync(): boolean {
  return !isPackGatedByEnv();
}
