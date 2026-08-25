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
| Doppel | Find the word connecting two German compounds. | One answer forms a valid compound with the left clue and another with the right clue. |
| Galgenwort | Guess a German word before running out of mistakes. | Guess letters from a clue category; wrong guesses count against the limit. |
| Formwort | Solve a 5- to 7-letter word with shape and color feedback. | Guess words and use visual hints to infer repeated letters and positions. |
| Worttreffer | Guess a 4- to 7-letter word with color feedback. | Green means correct position, yellow means present elsewhere, gray means absent. |
| Wortleiter | Transform a 4-letter start word into a target word. | Each intermediate word must be valid German and change exactly one letter. Puzzles are selected from prepared word-graph candidates. |
| Wortcode | Crack a 5- to 7-letter word with Mastermind-style logic. | Each guess returns positional and non-positional match counts. |

## Current Features

- Random puzzle selection when opening a game without saved in-progress input; Worttreffer chooses 4- to 7-letter words automatically, while Formwort and Wortcode choose 5-, 6-, or 7-letter words.
- Tageskniffe: each Berlin day highlights three existing games on Home; completing one puzzle in each highlighted game completes the day.
- Local daily streaks based on consecutive completed Tageskniffe days.
- Personal statistics stored locally in SQLite (`expo-sqlite`): every round is recorded as raw data (sessions, guesses with order/timing, hint events) via the central `StatsRecorder`. The Home streak and the `/stats` screen (lifetime summary, outcomes, streaks, per-game counts, word/letter stats, personal records) are computed from that raw data. Stats are strictly local; no guess words or answers reach PostHog.
- Saved in-progress rounds with draft input and a Home `Weiterspielen` chip.
- Shared local progress model stored in AsyncStorage.
- Static generated allowed-guess data checked into the app.
- Curated target lists checked into source files under `apps/mobile/src/games`.
- Optional daily reminder notifications.
- Sentry and PostHog instrumentation with no-op fallback behavior.

## Maintenance Rule

Update this file whenever a game is added, game rules change, or a user-facing feature ships.
