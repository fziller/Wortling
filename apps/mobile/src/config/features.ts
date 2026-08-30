// Central feature flags — one place to add/retire flags.
// For packs, the env var is the flag; this file documents it.
export const FEATURES = {
  // When true, word packs (bio etc) are premium-gated. Flip via EXPO_PUBLIC_PACKS_GATED=true + app restart / OTA.
  // Default false (free) so dev/test sees packs without paywall.
  packsGated: process.env.EXPO_PUBLIC_PACKS_GATED === "true" || process.env.EXPO_PUBLIC_PACKS_GATED === "1",
} as const;
