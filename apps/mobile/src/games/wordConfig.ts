// Central word configuration - single source of truth for word filtering.
// Change thresholds here and run `yarn content:generate` to regenerate all lengths.
// Imported by app runtime (wordBuckets.ts) and by build script (import-dwds-words.mjs via JSON read).

export const WORD_TIERS = {
  easy: 3.8,
  medium: 2.9,
  hard: 2.2,
} as const;

// Per-length medium threshold for classic (base ∩ tier). Normal words now ≥2.9.
// 4 stays slightly looser (2.2) to keep Wortleiter graph connected — 540 vs 1308 at 1.0.
// Bump to 2.9 for 4 as well if you want strict 2.9 across all lengths (will cut 4-letter pool ~60%).
export const WORD_THRESHOLDS_BY_LENGTH = {
  4: 2.2,
  5: 2.9,
  6: 2.9,
  7: 2.9,
} as const satisfies Record<4 | 5 | 6 | 7, number>;

export const WORD_CONFIG_VERSION = 3;

// Packs — domain word packages (bio etc). Zipf is null for domain packs (no frequency tier filtering).
export const PACKS = {
  bio: {
    id: "bio" as const,
    label: "Biologie",
    description: "Biologie-Wörter (zelle, enzym, organ …) — ohne Zipf, alle validen Formen sind Targets.",
    lengths: [4, 5, 6, 7] as const,
    zipf: null as null,
  },
} as const;

export type PackId = keyof typeof PACKS;
export type PackFrequency = "normal" | "haeufig";

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
