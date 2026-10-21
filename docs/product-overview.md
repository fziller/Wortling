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
| Anagramm | Reorder scrambled letters into a German word. | New rounds use curated five- to eight-letter words (5% / 40% / 35% / 20%). Place every tile once, solve within five wrong attempts, and use hints to lock correct positions across further attempts. Valid alternative anagrams also win and are shown as the solved word. |
| Dazwischen | Narrow down a German target word alphabetically. | Guess valid 5-letter words; each guess shows whether the target comes before or after it. |
| Galgenwort | Guess a German word before running out of mistakes. | Guess letters from a clue category; wrong guesses count against the limit. |
| Formwort | Solve a 5- to 7-letter word with shape and color feedback. | Guess words and use visual hints to infer repeated letters and positions. |
| Worttreffer | Guess a 4- to 7-letter word with color feedback. | Green means correct position, yellow means present elsewhere, gray means absent. |
| Wortschmelze | Guess an 8-letter merge made from two overlapping 5-letter German words. | The last two letters of the first word are the first two letters of the second word; color feedback matches Worttreffer. |
| Wabenwort | Build German words from a seven-letter honeycomb. | Words have at least four letters, must use the center letter, and may repeat letters. Every valid generated word form counts; curated common words power hints and the visible solution pool. Longer words score more; pangrams use all seven letters. Reach Gold to complete a round. |
| Silbenmix | Reassemble several German words from a shared pool of shuffled syllables. | Tap syllables into one word at a time, confirm a complete word, and use every syllable exactly once. Puzzles are generated from common curated words with German orthographic hyphenation patterns; only uniquely solvable complete word groups are included. |
| Wortleiter | Transform a 4-letter start word into a target word. | Each intermediate word must be valid German and change exactly one letter. Puzzles are selected from prepared word-graph candidates. |
| Wortcode | Crack a 5- to 7-letter word with Mastermind-style logic. | Each guess returns positional and non-positional match counts; manual notes can mark letters as included, exact, or absent. |

## Current Features

- Random puzzle selection when opening a game without saved in-progress input; Anagramm chooses curated 5- to 8-letter words automatically (5%, 40%, 35%, 20% by length), Worttreffer chooses 4- to 7-letter words automatically, while Formwort and Wortcode choose 5-, 6-, or 7-letter words.
- Tageskniffe: each Berlin day highlights three existing games on Home; completing one puzzle in each highlighted game completes the day.
- Rounds are selected randomly and locally avoid each game's ten most recently selected puzzles, while an in-progress round is always restored exactly.
- Tageskniffe continuation: Home highlights unfinished Tageskniffe, result screens replace the completed game with the next open Tageskniff so Back returns Home, daily reminders deep-link to the next open Tageskniff, and an optional evening reminder is scheduled only after a player has started but not finished the Tageskniffe.
- Local daily streaks based on consecutive completed Tageskniffe days.
- Personal statistics stored locally in SQLite (`expo-sqlite`): every round is recorded as raw data (sessions, guesses with order/timing, hint events) via the central `StatsRecorder`. The Home streak and the `/stats` screen (lifetime summary, outcomes, streaks, per-game counts, word/letter stats, personal records, and Anagramm-specific free metrics) are computed from that raw data. Stats are strictly local; no guess words or answers reach PostHog.
- Saved in-progress rounds with draft input and a Home `Weiterspielen` chip.
- Anagramm and Silbenmix support drag-and-drop for placing and reordering letter or syllable tiles; their original tap controls remain available.
- New installs start with three global Hinweise. Spent hints regenerate every 30 minutes up to three and can be spent across all games. A local reminder is scheduled when the wallet is full. Letter-based Hinweise render as Worttreffer-style green input tiles without locking player input; Galgenwort reveals a correct letter, Wortleiter inserts a valid next step toward the target, Dazwischen reveals a random target letter as a placeholder, Wortschmelze reuses Worttreffer-style letter placeholders, and Doppel unlocks its staged clues. Development and Preview builds expose isolated debug controls for shorter regeneration intervals and notification tests; Production never exposes them.
- Games with a fixed attempt limit offer unlimited continued play after the official loss. The loss remains final for win rate and Tageskniff streaks; a later solve is recorded separately.
- Shared local progress model stored in AsyncStorage.
- Static generated allowed-guess data checked into the app. `allowedGuesses` always contains the **union of all packs** (core ∪ bio …) — even when a pack is disabled in settings. Only `targetWords` are gated by pack enable/frequency; guessing is never blocked.
- Core solution words must be present in SUBTLEX-DE and pass a versioned English-word review policy. Broad allowed guesses remain intentionally larger. Wabenwort derives its curated words, hints, and rank thresholds only from reviewed Core targets; broader accepted words cannot inflate rank thresholds.
- Curated target lists derived from generated allowed guesses via SUBTLEX-DE Zipf tiers (easy ≥3.8, medium ≥2.9, hard ≥2.2, unknown <2.2) — normal games use easy+medium (Zipf ≥2.9 for 5–7, ≥2.2 for 4), hard/unknown stay guess-only. Sources: `apps/mobile/scripts/data/subtlex-de.tsv` (FrequencyWords de_50k, Zipf = log10(freq per billion)). Domain packs (bio) skip Zipf entirely — all valid shapes are targets.
- Generated files per length: `allowedGuesses.ts` (full core, merged at runtime with packs), `targetWords.ts` (easy+medium), `wordMeta.ts` (all words with zipf/tier), plus `src/games/packs/bio/generated/bioTargets.ts` per length (bio targets, no Zipf).
- Word pipeline is modular: `scripts/pipeline/shared.mjs` (normalize/shape/bucket/tier), `scripts/sources/{dwds,morphology,bio}.mjs` (adapters), `scripts/import-*.mjs` (import/bewerten), `scripts/data/{subtlex-de,bio}.tsv` (sources). New pack = 1 adapter + 1 TSV + 1 entry in `wordConfig.ts:PACKS`.
- Wortschmelze puzzles are generated at build time from filtered 5-letter pools (`klassisch`, `erweitert`, `hart`) via `scripts/generate-wortschmelze-puzzles.mjs` into `src/games/wortschmelze/generated/puzzles.ts`.
- Wabenwort puzzles are generated at build time from validated 4- to 12-letter word data via `scripts/generate-wabenwort-puzzles.mjs`. Every valid generated word form matching a puzzle's letters is accepted regardless of Zipf frequency; common base-form words remain the curated source for puzzle selection, hints, and visible solutions. Each generated puzzle stores its exact accepted words, word-count thresholds, and pangrams for offline runtime lookups.
- Silbenmix puzzles are generated at build time from curated common target words via `scripts/generate-silbenmix-puzzles.mjs`. New rounds contain three words with 10–12 syllables (35%), four with 12–15 (35%), or five with 15–18 (30%); word lengths vary within every mix, and larger mixes include at least one four- or five-syllable word. The build pipeline uses vendored MIT-licensed `hyph-de-1996` German orthographic hyphenation patterns, rejects unsuitable splits, and accepts only word groups with one valid complete partition of the available syllable tiles. Runtime selects and locally persists a random candidate; there are no manually maintained puzzles or daily seeds.
- Word packs: `bio` (Biologie) remains implemented in the code/data pipeline for all games (4–7 letters), but the Settings UI currently presents word packs only as a coming-soon teaser until packs are product-ready.
- Word stats at a glance: `docs/word-stats.md` (auto-generated via `yarn words:stats` after `content:generate`) — counts per length & tier/bucket & pack.
- Optional daily and unfinished-Tageskniff reminders, plus a separately controllable local reminder when the three-hint wallet is full. Notification permission is requested during startup; all notification features degrade safely when declined.
- First-run onboarding explains the Tageskniffe loop and can be replayed from Home; development builds can reset it from Settings.
- Each game opens its rules modal automatically once for players with no local history in that game; the header help remains available at all times. After a player's first visible game result, Wortkniff asks once in its own modal whether they want to rate the app. Both choices are saved locally, so a declined prompt does not return. Accepting first attempts the native review request and opens the store review page when native review is unavailable. Settings always offers `App bewerten`, which opens the direct App Store or Play Store review page.
- Spoiler-safe result sharing renders a dedicated share card image via native sharing, with text fallback when image sharing is unavailable.
- A versioned news/update modal exists but is currently inactive. Set `currentNews` in `apps/mobile/src/news/current.ts` to announce newly shipped user-facing changes once per news ID; development builds can reset the seen state from Settings.
- Lightweight haptic feedback is used for keyboard input, invalid guesses, result moments, and Tageskniffe completion.
- Sentry and PostHog instrumentation with no-op fallback behavior.
- The splash screen footer and Settings ("Über Wortkniff") show the app version plus the short EAS Update ID when an OTA update is active, so support cases can identify the exact running build.
- When an EAS OTA update has downloaded, a one-time snackbar offers an optional app restart. Ignoring it keeps the current session unchanged; the downloaded update activates on a later app launch.

## Hidden / Incubating Games

- Doppel remains in code, tests, routing, and existing stats support, but is hidden from Home and excluded from Tageskniffe until its curated puzzle pool is strong enough for launch.

## Maintenance Rule

Update this file whenever a game is added, game rules change, or a user-facing feature ships.
