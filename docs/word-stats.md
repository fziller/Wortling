# Wort-Statistik

> Auto-generated — `yarn words:stats` (oder `yarn content:generate` regeneriert Bio + Core). Quelle: `src/games/**/generated/*.ts` + `src/games/packs/bio/generated/bioTargets.ts`.
> Letztes Update: 2026-10-18 · Core via DWDS + LanguageTool POS + SUBTLEX-DE Zipf und Englisch-Review, Bio ohne Zipf (alle validen Shapes).

## Überblick

| Kategorie | Wörter | Hinweis |
|---|---|---|
| Core allowed (alle ratebaren, 4–7) | 45800 | `allowedGuesses` — immer vollständig, auch Bio ist hier drin (Union) |
| Core klassisch Targets (Zipf ≥ Threshold, base only) | 2570 | `targetWords` — was ohne Pack als Lösung kommt |
| Bio Targets (4–7, ohne Zipf) | 76 | `bioTargetWordsByLength` — nur wenn Pack aktiviert |

* `allowedGuesses` enthält **immer** Core ∪ Bio (auch wenn Bio in Settings aus) — nur Targets sind gated. Siehe `src/games/packs/allowed.ts`.*

## Core pro Länge & Schwierigkeit

| Länge | allowed | klassisch | erweitert | hart | easy | medium | hard | unknown |
|---|---|---|---|---|---|---|---|
| 4 | 2376 | 610 | 661 | 1025 | 576 | 559 | 219 | 1022 |
| 5 | 6297 | 569 | 671 | 1559 | 943 | 1236 | 464 | 3654 |
| 6 | 13420 | 680 | 907 | 2366 | 1169 | 1958 | 840 | 9453 |
| 7 | 23707 | 711 | 981 | 2975 | 966 | 2251 | 1145 | 19345 |

* Thresholds: 4→2.2, 5–7→2.9 (`wordConfig.ts:WORD_THRESHOLDS_BY_LENGTH`), Tiers: easy ≥3.8, medium ≥2.9, hard ≥2.2. `klassisch=base∩≥thr`, `erweitert=base+plural+verb-finite∩≥thr`, `hart=alle∖genitive∩≥2.2`.*

### Buckets pro Länge (aus wordMeta)

| Länge | base | plural | verb-finite | partizip | konjunktiv | imperativ | adj-flex | genitive |
|---|---|---|---|---|---|---|---|---|
| 4 | 1100 | 0 | 77 | 0 | 109 | 552 | 22 | 516 |
| 5 | 2296 | 35 | 305 | 10 | 862 | 815 | 138 | 1836 |
| 6 | 4301 | 241 | 1078 | 287 | 2884 | 821 | 411 | 3397 |
| 7 | 7313 | 573 | 1894 | 1489 | 5727 | 983 | 970 | 4758 |

* Genitive nie Target, aber in allowed für Wortleiter-Graph. *

## Bio-Paket (ohne Zipf)

| Länge | Bio Targets | Anteil an Core klassisch | Beispiele |
|---|---|---|---|
| 4 | 13 | 2.1% | alge, auge, biom, blut, darm |
| 5 | 32 | 5.6% | algen, amöbe, amobe, arten, biome |
| 6 | 20 | 2.9% | atmung, embryo, enzyme, gehirn, gelenk |
| 7 | 11 | 1.5% | antigen, biotope, ferment, habitat, knochen |

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
