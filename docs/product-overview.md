# Wortkniff Product Overview

Wortkniff is an offline-first German daily word game app. It bundles short, polished word puzzles with static word data, local progress, and no account requirement.

## Product Positioning

- German-first daily word puzzles for quick sessions.
- Multiple lightweight game modes in one app instead of one clone mechanic.
- Curated target words and puzzles selected randomly instead of random dictionary noise.
- Fully playable offline with local progress storage.
- Network-dependent features such as analytics, notifications, and crash reporting must never block gameplay.

## Current Games

| Game | Summary | Rules Snapshot |
| --- | --- | --- |
| Dazwischen | Narrow down a German target word alphabetically. | Guess valid 5-letter words; each guess shows whether the target comes before or after it. |
| Galgenwort | Guess a German word before running out of mistakes. | Guess letters from a clue category; wrong guesses count against the limit. |
| Formwort | Solve a 5- to 7-letter word with shape and color feedback. | Guess words and use visual hints to infer repeated letters and positions. |
| Worttreffer | Guess a 4- to 7-letter word with color feedback. | Green means correct position, yellow means present elsewhere, gray means absent. |
| Wortschmelze | Guess an 8-letter merge made from two overlapping 5-letter German words. | The last two letters of the first word are the first two letters of the second word; color feedback matches Worttreffer. |
| Wortleiter | Transform a 4-letter start word into a target word. | Each intermediate word must be valid German and change exactly one letter. Puzzles are selected from prepared word-graph candidates. |
| Wortcode | Crack a 5- to 7-letter word with Mastermind-style logic. | Each guess returns positional and non-positional match counts; manual notes can mark letters as included, exact, or absent. |

## Current Features

- Random puzzle selection when opening a game without saved in-progress input; Worttreffer chooses 4- to 7-letter words automatically, while Formwort and Wortcode choose 5-, 6-, or 7-letter words.
- Tageskniffe: each Berlin day highlights three existing games on Home; completing one puzzle in each highlighted game completes the day.
- Tageskniffe continuation: Home highlights unfinished Tageskniffe, result screens can jump straight to the next open Tageskniff, daily reminders deep-link to the next open Tageskniff, and an optional evening reminder is scheduled only after a player has started but not finished the Tageskniffe.
- Local daily streaks based on consecutive completed Tageskniffe days.
- Personal statistics stored locally in SQLite (`expo-sqlite`): every round is recorded as raw data (sessions, guesses with order/timing, hint events) via the central `StatsRecorder`. The Home streak and the `/stats` screen (lifetime summary, outcomes, streaks, per-game counts, word/letter stats, personal records) are computed from that raw data. Stats are strictly local; no guess words or answers reach PostHog.
- Saved in-progress rounds with draft input and a Home `Weiterspielen` chip.
- Global Hinweise are earned through wins and can be spent across all games: three solved puzzles earn one Hinweis, and onboarding states this rule. Letter-based Hinweise render as ghost placeholders without locking player input; Galgenwort reveals a correct letter, Wortleiter inserts a valid next step toward the target, Dazwischen reveals a random target letter as a placeholder, Wortschmelze reuses Worttreffer-style letter placeholders, and Doppel unlocks its staged clues.
- Shared local progress model stored in AsyncStorage.
- Static generated allowed-guess data checked into the app. `allowedGuesses` always contains the **union of all packs** (core ∪ bio …) — even when a pack is disabled in settings. Only `targetWords` are gated by pack enable/frequency; guessing is never blocked.
- Curated target lists derived from generated allowed guesses via SUBTLEX-DE Zipf tiers (easy ≥3.8, medium ≥2.9, hard ≥2.2, unknown <2.2) — normal games use easy+medium (Zipf ≥2.9 for 5–7, ≥2.2 for 4), hard/unknown stay guess-only. Sources: `apps/mobile/scripts/data/subtlex-de.tsv` (FrequencyWords de_50k, Zipf = log10(freq per billion)). Domain packs (bio) skip Zipf entirely — all valid shapes are targets.
- Generated files per length: `allowedGuesses.ts` (full core, merged at runtime with packs), `targetWords.ts` (easy+medium), `wordMeta.ts` (all words with zipf/tier), plus `src/games/packs/bio/generated/bioTargets.ts` per length (bio targets, no Zipf).
- Word pipeline is modular: `scripts/pipeline/shared.mjs` (normalize/shape/bucket/tier), `scripts/sources/{dwds,morphology,bio}.mjs` (adapters), `scripts/import-*.mjs` (import/bewerten), `scripts/data/{subtlex-de,bio}.tsv` (sources). New pack = 1 adapter + 1 TSV + 1 entry in `wordConfig.ts:PACKS`.
- Wortschmelze puzzles are generated at build time from filtered 5-letter pools (`klassisch`, `erweitert`, `hart`) via `scripts/generate-wortschmelze-puzzles.mjs` into `src/games/wortschmelze/generated/puzzles.ts`.
- Word packs: `bio` (Biologie) remains implemented in the code/data pipeline for all games (4–7 letters), but the Settings UI currently presents word packs only as a coming-soon teaser until packs are product-ready.
- Word stats at a glance: `docs/word-stats.md` (auto-generated via `yarn words:stats` after `content:generate`) — counts per length & tier/bucket & pack.
- Optional daily reminder notifications.
- First-run onboarding explains the Tageskniffe loop and can be replayed from Home; development builds can reset it from Settings.
- Spoiler-safe result sharing renders a dedicated share card image via native sharing, with text fallback when image sharing is unavailable.
- A versioned news/update modal exists but is currently inactive. Set `currentNews` in `apps/mobile/src/news/current.ts` to announce newly shipped user-facing changes once per news ID; development builds can reset the seen state from Settings.
- Lightweight haptic feedback is used for keyboard input, invalid guesses, result moments, and Tageskniffe completion.
- Sentry and PostHog instrumentation with no-op fallback behavior.

## Hidden / Incubating Games

- Doppel remains in code, tests, routing, and existing stats support, but is hidden from Home and excluded from Tageskniffe until its curated puzzle pool is strong enough for launch.

## Maintenance Rule

Update this file whenever a game is added, game rules change, or a user-facing feature ships.
