# Wort-Statistik

> Auto-generated — `yarn words:stats` (oder `yarn content:generate` regeneriert Bio + Core). Quelle: `src/games/**/generated/*.ts` + `src/games/packs/bio/generated/bioTargets.ts`.
> Letztes Update: 2026-08-30 · Core via DWDS + LanguageTool POS + SUBTLEX-DE Zipf, Bio ohne Zipf (alle validen Shapes).

## Überblick

| Kategorie | Wörter | Hinweis |
|---|---|---|
| Core allowed (alle ratebaren, 4–7) | 47616 | `allowedGuesses` — immer vollständig, auch Bio ist hier drin (Union) |
| Core klassisch Targets (Zipf ≥ Threshold, base only) | 4047 | `targetWords` — was ohne Pack als Lösung kommt |
| Bio Targets (4–7, ohne Zipf) | 76 | `bioTargetWordsByLength` — nur wenn Pack aktiviert |

* `allowedGuesses` enthält **immer** Core ∪ Bio (auch wenn Bio in Settings aus) — nur Targets sind gated. Siehe `src/games/packs/allowed.ts`.*

## Core pro Länge & Schwierigkeit

| Länge | allowed | klassisch | erweitert | hart | easy | medium | hard | unknown |
|---|---|---|---|---|---|---|---|
| 4 | 2726 | 1308 | 1386 | 2122 | 595 | 866 | 0 | 1265 |
| 5 | 6807 | 770 | 895 | 1629 | 953 | 1798 | 0 | 4056 |
| 6 | 13931 | 942 | 1250 | 2394 | 1171 | 2853 | 0 | 9907 |
| 7 | 24152 | 1027 | 1409 | 2989 | 967 | 3428 | 0 | 19757 |

* Thresholds: 4→1.0, 5–7→2.2 (`wordConfig.ts:WORD_THRESHOLDS_BY_LENGTH`), Tiers: easy ≥3.8, medium ≥2.2, hard ≥1.5. `klassisch=base∩≥thr`, `erweitert=base+plural+verb-finite∩≥thr`, `hart=alle∖genitive∩≥1.5`.*

### Buckets pro Länge (aus wordMeta)

| Länge | base | plural | verb-finite | partizip | konjunktiv | imperativ | adj-flex | genitive |
|---|---|---|---|---|---|---|---|---|
| 4 | 1308 | 0 | 78 | 0 | 120 | 593 | 23 | 604 |
| 5 | 2573 | 35 | 306 | 10 | 873 | 837 | 140 | 2033 |
| 6 | 4543 | 241 | 1082 | 288 | 2908 | 827 | 419 | 3623 |
| 7 | 7479 | 574 | 1896 | 1489 | 5735 | 987 | 981 | 5011 |

* Genitive nie Target, aber in allowed für Wortleiter-Graph. *

## Bio-Paket (ohne Zipf)

| Länge | Bio Targets | Anteil an Core klassisch | Beispiele |
|---|---|---|---|
| 4 | 13 | 1.0% | alge, auge, biom, blut, darm |
| 5 | 32 | 4.2% | algen, amöbe, amobe, arten, biome |
| 6 | 20 | 2.1% | atmung, embryo, enzyme, gehirn, gelenk |
| 7 | 11 | 1.1% | antigen, biotope, ferment, habitat, knochen |

* Bio: `scripts/data/bio.tsv` + optional Wikidata (`WIKIDATA_BIO=1`) → `scripts/import-bio-words.mjs`. Kein Zipf-Filter, alle Shapes `a-zäöü{4,7}` ∩ !genitive sind Targets. Frequenz in App: `normal`=merge uniform (~2% Bio), `haeufig`=70% Bio / 30% Core (deterministisch, siehe `src/games/packs/selection.ts`). Gilt für alle Spiele 4–7; Galgenwort 4–10 gefiltert.

## Packs & Freischaltung

- Pack `bio` ist Premium-gated via `src/premium/packsAccess.ts` (`isPackGated()` + `hasPremiumAccess()`). Settings rendert Toggle nur wenn nicht gegated oder Premium vorhanden, sonst Paywall-CTA. So kann später ein Flag / Paywall alles verstecken ohne Game-Logik zu ändern.
- `allowedGuesses` bleibt immer Union (kein Gate) — Gate betrifft nur Daily/Next Target-Auswahl (siehe `src/games/*/daily.ts`).

## Quellen & Pipeline

- Core: DWDS Lemma DB + LanguageTool german-pos-dict → `scripts/import-dwds-words.mjs` (pro Länge 4 Dateien: allowed/target/erweitert/hart/wordMeta) — Zipf via `scripts/data/subtlex-de.tsv`.
- Bio: `scripts/data/bio.tsv` → `scripts/import-bio-words.mjs` (pro Länge Bio-Targets).
- Shared Helpers: `scripts/pipeline/shared.mjs`, Adapter: `scripts/sources/{dwds,morphology,bio}.mjs`. Neu = 1 Adapter + 1 TSV + `wordConfig.ts:PACKS`.
- Generierung: `yarn content:generate` (words:import + bio + wortleiter) · Quick-Skip: `scripts/content-generate-if-needed.mjs`.

---
*Regenerieren: `yarn words:stats` nach `yarn content:generate`. Nicht von Hand editieren — Script überschreibt.*
