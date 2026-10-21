# Wort-Statistik

> Auto-generated — `yarn words:stats` (oder `yarn content:generate` regeneriert Bio + Core). Quelle: `src/games/**/generated/*.ts` + `src/games/packs/bio/generated/bioTargets.ts`.
> Letztes Update: 2026-10-21 · Core via DWDS + LanguageTool POS + SUBTLEX-DE Zipf und Englisch-Review, Bio ohne Zipf (alle validen Shapes).

## Überblick

| Kategorie | Wörter | Hinweis |
|---|---|---|
| Core allowed (alle ratebaren, 4–7) | 45695 | `allowedGuesses` — immer vollständig, auch Bio ist hier drin (Union) |
| Core klassisch Targets (Zipf ≥ Threshold, base only) | 2475 | `targetWords` — was ohne Pack als Lösung kommt |
| Bio Targets (4–7, ohne Zipf) | 76 | `bioTargetWordsByLength` — nur wenn Pack aktiviert |

* `allowedGuesses` enthält **immer** Core ∪ Bio (auch wenn Bio in Settings aus) — nur Targets sind gated. Siehe `src/games/packs/allowed.ts`.*

## Core pro Länge & Schwierigkeit

| Länge | allowed | klassisch | erweitert | hart | easy | medium | hard | unknown |
|---|---|---|---|---|---|---|---|
| 4 | 2357 | 582 | 633 | 991 | 570 | 551 | 216 | 1020 |
| 5 | 6262 | 536 | 636 | 1514 | 929 | 1225 | 460 | 3648 |
| 6 | 13387 | 656 | 882 | 2329 | 1161 | 1946 | 837 | 9443 |
| 7 | 23689 | 701 | 971 | 2964 | 966 | 2241 | 1145 | 19337 |

* Thresholds: 4→2.2, 5–7→2.9 (`wordConfig.ts:WORD_THRESHOLDS_BY_LENGTH`), Tiers: easy ≥3.8, medium ≥2.9, hard ≥2.2. `klassisch=base∩≥thr`, `erweitert=base+plural+verb-finite∩≥thr`, `hart=alle∖genitive∩≥2.2`.*

### Buckets pro Länge (aus wordMeta)

| Länge | base | plural | verb-finite | partizip | konjunktiv | imperativ | adj-flex | genitive |
|---|---|---|---|---|---|---|---|---|
| 4 | 1070 | 0 | 77 | 0 | 108 | 545 | 22 | 535 |
| 5 | 2253 | 35 | 303 | 10 | 859 | 812 | 137 | 1853 |
| 6 | 4259 | 241 | 1077 | 287 | 2879 | 815 | 410 | 3419 |
| 7 | 7295 | 573 | 1894 | 1488 | 5724 | 983 | 969 | 4763 |

* Genitive nie Target, aber in allowed für Wortleiter-Graph. *

## Bio-Paket (ohne Zipf)

| Länge | Bio Targets | Anteil an Core klassisch | Beispiele |
|---|---|---|---|
| 4 | 13 | 2.2% | alge, auge, biom, blut, darm |
| 5 | 32 | 6.0% | algen, amöbe, amobe, arten, biome |
| 6 | 20 | 3.0% | atmung, embryo, enzyme, gehirn, gelenk |
| 7 | 11 | 1.6% | antigen, biotope, ferment, habitat, knochen |

* Bio: `scripts/data/bio.tsv` + optional Wikidata (`WIKIDATA_BIO=1`) → `scripts/import-bio-words.mjs`. Kein Zipf-Filter, alle Shapes `a-zäöü{4,7}` ∩ !genitive sind Targets. Frequenz in App: `normal`=merge uniform (~3% Bio), `haeufig`=70% Bio / 30% Core (deterministisch, siehe `src/games/packs/selection.ts`). Gilt für alle Spiele 4–7; Galgenwort 4–10 gefiltert.

## Packs & Freischaltung

- Pack `bio` ist Premium-gated via `src/premium/packsAccess.ts` (`isPackGated()` + `hasPremiumAccess()`). Settings rendert Toggle nur wenn nicht gegated oder Premium vorhanden, sonst Paywall-CTA. So kann später ein Flag / Paywall alles verstecken ohne Game-Logik zu ändern.
- `allowedGuesses` bleibt immer Union (kein Gate) — Gate betrifft nur Daily/Next Target-Auswahl (siehe `src/games/*/daily.ts`).

## Quellen & Pipeline

- Core: DWDS Lemma DB + LanguageTool german-pos-dict → `scripts/import-dwds-words.mjs` (pro Länge 4 Dateien: allowed/target/erweitert/hart/wordMeta) — Zipf via `scripts/data/subtlex-de.tsv`.
- Core targets: English-only matches are blocked; ambiguous overlaps require a durable decision in `scripts/data/word-review-overrides.tsv` (`yarn words:review:generate`).
- Bio: `scripts/data/bio.tsv` → `scripts/import-bio-words.mjs` (pro Länge Bio-Targets).
- Shared Helpers: `scripts/pipeline/shared.mjs`, Adapter: `scripts/sources/{dwds,morphology,bio}.mjs`. Neu = 1 Adapter + 1 TSV + `wordConfig.ts:PACKS`.
- Generierung: `yarn content:generate` (words:import + bio + wortleiter) · Quick-Skip: `scripts/content-generate-if-needed.mjs`.

---
*Regenerieren: `yarn words:stats` nach `yarn content:generate`. Nicht von Hand editieren — Script überschreibt.*
