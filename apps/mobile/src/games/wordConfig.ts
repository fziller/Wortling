// Central word configuration - single source of truth for word filtering.
// Change thresholds here and run `yarn content:generate` to regenerate all lengths.
// Imported by app runtime (wordBuckets.ts) and by build script (import-dwds-words.mjs via JSON read).

export const WORD_TIERS = {
  easy: 3.8,
  medium: 2.2,
  hard: 1.5,
} as const;

// Per-length medium threshold for classic (base ∩ tier). 4 is deliberately looser for larger pool.
// 4: Wortleiter/Worttreffer-4 needs many rotations, 671 with 1.5 was still small → use 1.0 (all base) for 4.
export const WORD_THRESHOLDS_BY_LENGTH = {
  4: 1.0,
  5: 2.2,
  6: 2.2,
  7: 2.2,
} as const satisfies Record<4 | 5 | 6 | 7, number>;

export const WORD_CONFIG_VERSION = 1;

// Bucket mapping for presets
// klassisch = base only
// erweitert = base + plural + verb-finite
// hart = all non-genitive buckets (genitive never target)
export const WORD_BUCKETS = {
  base: "klassisch",
  plural: "erweitert",
  "verb-finite": "erweitert",
  partizip: "hart",
  konjunktiv: "hart",
  imperativ: "hart",
  "adj-flex": "hart",
  genitive: "never",
} as const;

export type WordBucket = keyof typeof WORD_BUCKETS;
