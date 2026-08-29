import type { HintPolicy } from "./types";

// Ad/purchase-ready abstraction. Today only "earned" is active.
// Flip via env/config later – game screens call these, not wallet directly.

export function getHintPolicy(): HintPolicy {
  // ponytail: env switch ready, defaults to earned. Later: EXPO_PUBLIC_HINT_POLICY
  const raw = process.env.EXPO_PUBLIC_HINT_POLICY as HintPolicy | undefined;
  if (raw === "ads" || raw === "purchase" || raw === "hybrid" || raw === "earned") return raw;
  return "earned";
}

export function isEarnedPolicy(policy: HintPolicy): boolean {
  return policy === "earned" || policy === "hybrid";
}

export function shouldShowEarnedProgress(policy: HintPolicy): boolean {
  return policy === "earned" || policy === "hybrid";
}

// Stub for future ad flow – resolves immediately today.
export async function requestAdHint(): Promise<boolean> {
  // ponytail: plug react-native-google-mobile-ads here when needed
  // e.g. await interstitial.show() -> true/false
  return false;
}
