# Wortkniff — App Context for Agents

> Purpose of this file: give another agent/chatbot everything it needs to reason about Wortkniff and generate ideas for improving and extending the app. Generated from the codebase (2026-09-10). Source of truth for product scope is `docs/product-overview.md`.

## 1. What the app is and why it exists

**Wortkniff** is an offline-first, German-first daily word-puzzle app (Expo + React Native + TypeScript). One app bundles several short, polished German word games instead of cloning a single mechanic (e.g. Wordle). Design goals:

- Quick sessions (2–4 minutes per game, shown as `estimatedMinutes` on each game card).
- Fully playable **offline** — word lists ship statically with the app, progress lives on-device. No account, no backend, no login.
- Network features (Sentry, PostHog, OTA updates, notifications) degrade gracefully and must never block gameplay.
- All user-facing game text is **German**. Docs and code comments are English.

## 2. Games

All games share pure-TypeScript logic under `apps/mobile/src/games/<id>/` (`engine.ts`, `content.ts`, `daily.ts`) plus React Native screens under `app/games/`. Game registry: `src/games/registry.ts`. Rules copy: `src/games/help.ts` (shown in the in-game help modal, never inline in gameplay content).

| Game (route) | Letters | How it works |
|---|---|---|
| **Dazwischen** (`/games/between`) | 5 | Alphabetical narrowing: guess valid 5-letter words; each guess tells whether the target sorts before/after it. Shows remaining-word counts between bounds plus a letter strip of still-fitting letters. |
| **Galgenwort** (`/games/galgenwort`) | 4–10 (filtered) | Hangman-style: guess letters from a clue category; correct letters are revealed everywhere, wrong guesses consume a limited mistake budget. Hint reveals a correct letter. |
| **Formwort** (`/games/formwort`) | 5–7, 6 attempts | Shape + color Wordle: each target letter has a shape shown upfront (same shape = same letter), guesses get green/yellow/gray feedback. |
| **Worttreffer** (`/games/worttreffer`) | 4–7, 6 attempts | Classic Wordle with German words: green = correct position, yellow = present elsewhere, gray = absent. Keyboard remembers hints. |
| **Wortschmelze** (`/games/wortschmelze`) | 8 (5+5 overlap), 6 attempts | Two overlapping 5-letter words merge into one 8-letter solution (last 2 letters of word 1 = first 2 of word 2, e.g. WALZE + ZEBRA → WALZEBRA). Feedback like Worttreffer. Puzzles pre-generated at build time (`scripts/generate-wortschmelze-puzzles.mjs` → `generated/puzzles.ts`). |
| **Wortleiter** (`/games/wortleiter`) | 4 | Word ladder: transform start word into target word, each step must be a valid German word changing exactly one letter, no repeats. Puzzles come from a prepared word-graph candidate pool (`scripts/generate-wortleiter-puzzles.mjs`, limit 1500). Hint inserts a valid next step. |
| **Wortcode** (`/games/wortcode`) | 5–7 | Mastermind logic: each guess returns counts (green = exact, yellow = contained, red = absent) without revealing positions. Players can annotate letters in past guesses (maybe-included / maybe-exact / sure-absent), propagated across matching letters. |
| **Doppel** (`/games/doppel`, HIDDEN) | compounds | Find the word linking two compounds (KINDER + SPIEL + PLATZ → Kinderspiel + Spielplatz). Fully implemented + tested but hidden from Home and Tageskniffe until the curated pool is launch-ready. |

Gameplay shell: every game screen uses `GameScreenFrame` (consistent header, content, action row, keyboard/footer with centralized safe-area handling). Per-game actions (`Lösung anzeigen`, `Hinweis`, `Zurück`) live in the frame action row. Help modal explains rules; content area shows only concrete feedback/hints/results.

Shared systems across games:
- **Tageskniffe (daily quests):** each Berlin day highlights 3 existing games on Home (`src/dailyKniffe.ts`, seed via Berlin date key). Completing one puzzle in each = day complete. Result screens can jump to the next open Tageskniff; daily + optional evening reminders (20:30, only if started-but-unfinished) deep-link to the next open one. Consecutive completed days = streak.
- **Hints (global wallet):** 3 solved puzzles earn 1 Hinweis (`src/hints/`). Spendable across all games; letter hints render as non-locking ghost placeholders (except Galgenwort reveals a letter, Wortleiter inserts a step, Doppel unlocks staged clues). `Lösung anzeigen` reveals the answer but the round counts as `revealed`, not won.
- **Saved rounds:** in-progress rounds (incl. draft input) persist in AsyncStorage; Home shows a `Weiterspielen` chip.
- **Result sharing:** spoiler-safe share-card image via native sharing, text fallback.
- **Haptics:** keyboard input, invalid guesses, result moments, Tageskniffe completion (`expo-haptics`).

## 3. What the user sees (screens & flows)

- **Home (`app/index.tsx`):** Tageskniffe card (3 highlighted games + progress + streak flame), then one card per visible game (title, short description, letter badge, daily marker, in-progress state, last status). First run shows an **onboarding modal** explaining the Tageskniffe loop (replayable from Home). A versioned **news modal** (`src/news/`, currently `currentNews = null` = inactive) can announce updates; Home never stacks onboarding + news.
- **Game screens (`app/games/*.tsx`):** puzzle board/tiles, shared word keyboard, action row (hint/solution/back), help modal, result modal (win/loss/reveal → stats recorded, share button, next-Tageskniff jump).
- **Stats (`app/stats.tsx`, `/stats`):** see section 4.
- **Settings (`app/settings.tsx`):** daily reminder (toggle + hour/minute steppers), evening unfinished-reminder toggle, Wortschatz difficulty (Klassisch always-on / Erweitert / Hart — applies to all games from next round), word-pack teaser (Biologie/Küche/Reise/Sport, currently "Bald" coming-soon, not purchasable), About, word-data credits (DWDS + LanguageTool + CC BY-SA 4.0 links), version/build. Dev-only menu: seed override, onboarding/news reset, hint balance, notification tests.
- **Notifications:** opt-in daily reminder at configured time + conditional evening nudge; badge count reflects open Tageskniffe.

## 4. Statistics (visible to the user)

All personal stats are **local-only in SQLite** (`expo-sqlite`, `wortkniff-stats.db`, `src/stats/`). Every round is stored as raw data — sessions (game, date, puzzle, word length, outcome, attempts, hints, durations), per-guess rows (sequence, timing, validity, game-specific `gameData`), hint events — written exclusively through the central recorder (`recorder.ts` / `useGameRecorder`: `start()` on first semantic action, `recordAcceptedGuess`/`recordRejectedGuess`, `recordHint()`, `finish(outcome)`). Games/screens never touch SQLite directly. Outcomes: `won | lost | revealed | abandoned`.

The `/stats` screen computes everything from raw rows (`src/stats/engine/`, `freeStats.ts`):

- **Headline:** rounds played, solve rate (%), days played.
- **Streaks:** activity streak (current/best, flame icon) + daily-puzzle win-day streak (current/best, star icon).
- **Outcomes:** counts for won / lost / revealed / abandoned.
- **Time & attempts:** total active time, Ø per round, Ø attempts, Ø hints.
- **Per game:** sessions + wins each, favorite (most-played) game starred.
- **Words & letters:** total valid guesses, distinct words, top-words and top-letters leaderboards.
- **Word lengths:** session counts per length.
- **Records:** fastest win, fewest attempts (win), most rounds in a day, most wins in a day.
- **Recent rounds:** list with outcome icon/pill, game + date, length/attempts/duration.
- Empty state explains stats collect locally; footer repeats "stays on your device".

Analytics (PostHog) tracks **behavior only, never content**: `screen_viewed`, `game_started/completed/abandoned`, `help_opened`, `solution_revealed`, `hint_used`, settings changes, shares, streaks — no guess words, answers, or targets ever leave the device. Sentry picks up render errors via boundaries.

## 5. How words are sourced and selected

Key principle: **word import/generation is build-time only; gameplay is runtime lookups** (`Set`/`Map`, pre-sorted lists, no runtime fetching or heavy sorting on screen open).

- **Sources:** DWDS Lemma Database (Berlin-Brandenburg Academy of Sciences) + LanguageTool `german-pos-dict` (CC BY-SA 4.0, credited in Settings).
- **Two data kinds per length (4–7):** `targetWords` (small curated daily solutions) vs `allowedGuesses` (large validation lists; also drive Dazwischen rank math, hence generated pre-sorted). Generated files carry a header and must never be hand-edited — change the import script or curated lists instead.
- **Frequency tiers via SUBTLEX-DE Zipf** (`scripts/data/subtlex-de.tsv`): easy ≥3.8, medium ≥2.9, hard ≥2.2, unknown below. Normal games use easy+medium (threshold ≥2.9 for 5–7; 4-letter uses ≥2.2 to keep the Wortleiter graph connected). Hard/unknown stay guess-only. Thresholds live in `src/games/wordConfig.ts` (`WORD_CONFIG_VERSION = 3` — bump when selection/saved-progress semantics change).
- **Morphology buckets** (`WORD_BUCKETS`): `klassisch` = base forms only; `erweitert` adds plurals + finite verbs; `hart` adds participles, conjunctives, imperatives, adjective inflections. Genitives are never targets (but stay guessable, needed for the Wortleiter graph). User picks the preset in Settings.
- **Domain packs:** `PACKS` in `wordConfig.ts` (currently `bio` = Biologie, 76 targets across 4–7, no Zipf filter). `allowedGuesses` is always the **union of all packs** (guessing never blocked); only target selection is pack-gated. Pipeline is modular (`scripts/pipeline/shared.mjs` + `scripts/sources/*.mjs` adapters); a new pack = 1 adapter + 1 TSV + 1 `PACKS` entry. Packs are premium-gateable (`src/premium/packsAccess.ts`) but the Settings UI currently shows them as coming-soon.
- **Special pools:** Wortschmelze 8-letter merges and Wortleiter ladder candidates are pre-generated scripts into checked-in files.
- **Regeneration:** `yarn content:generate` (runs on every build incl. OTA) = word imports + bio + Wortleiter + Wortschmelze + `docs/word-stats.md` (auto counts per length/tier/bucket/pack). Scale today: ~47.6k allowed guesses, ~2.7k classic targets (see `docs/word-stats.md`).

## 6. Theming and design language

Single light theme, centralized in `src/design/tokens.ts` (no dark mode today):

- **Palette:** warm paper/cream surfaces (`paper #F7F1E8`, `raised #FFFDF8`), primary orange `#FF6B35` / dark `#D94A1E` / light `#FFF1DF`; semantic green `#21A67A` (correct), amber `#D98500` (partial), red `#C73E3A` (wrong); neutral ink `#17130D` + muted `#74685B`.
- **Per-game accents** (`gameAccent`): Dazwischen blue, Worttreffer/Galgenwort amber, Wortcode green, Wortschmelze brown, Doppel purple, Formwort pink, Wortleiter teal.
- **Type:** brand font Kalam-Bold (big 42pt titles), UI font InstrumentSans (Regular/Medium/SemiBold), tabular numerals for stats.
- **Shape/spacing:** large rounded cards (24px), pill controls, warm soft shadows, "tape" decorations on cards (Home/stat cards look like taped notes).
- **Motion (acceptance criterion for every UI change):** `react-native-reanimated` worklets only (offline-friendly, no JS-thread jank) — spring (~damping 18 / stiffness 220) or 160–260ms timing; toggles/switches animate track + knob, no hard jumps; screen cards enter with staggered `FadeInDown`.

## 7. Technical background

- **Stack:** Expo SDK 57 + React Native 0.86 + React 19 + TypeScript; `expo-router` (file-based routing in `app/`), Reanimated, Gesture Handler, Safe Area Context, Screens; dev builds via `expo-dev-client` (not Expo Go).
- **Storage:** AsyncStorage (progress, settings, onboarding/news flags, hint wallet) + `expo-sqlite` (stats raw data). No backend, no accounts, no gameplay network calls.
- **Services:** Sentry (`@sentry/react-native`, source maps uploaded on EAS production builds) + PostHog (`posthog-react-native`, content-free events) — both wrapped try-catch/no-op. `expo-notifications` (daily + evening reminders, badge), `expo-updates` (OTA; `content:generate` runs before builds/updates so word data refreshes), `expo-sharing` + `view-shot` (share cards), `expo-haptics`, `expo-localization` (Berlin-day logic).
- **Config:** secrets via `EXPO_PUBLIC_` env + `dotenvx`; never hardcoded. App variants: development/production.
- **Quality gates** (from `apps/mobile`): `yarn typecheck`, `npx expo-doctor`, `yarn expo install --check`, `yarn test` (vitest; engines have `.test.ts` files). Do not auto-update dependencies to satisfy hygiene checks — report mismatches instead.
- **Conventions for contributors:** game logic = pure TS functions under `src/games`; screens only render + dispatch; stats via central recorder only; files ~300 lines (soft); keep `docs/product-overview.md` updated on game/rule/feature changes; dependencies only change on explicit request or genuine need.

## 8. Known extension points (factual, for ideation)

- Doppel is implemented but unlaunched (needs a stronger curated pool).
- Word packs exist in pipeline + data (bio live in code) but Settings shows only a teaser; premium gating hook exists but no paywall/revenue yet.
- News modal infra exists but is inactive (`currentNews = null`).
- Stats engine stores raw guess-level data (incl. per-game `gameData` payloads) explicitly so future analytics can be computed retroactively — premium analytics is anticipated but not built.
- No social features (share is image/text export only), no accounts/sync, no dark mode, no additional game modes beyond the 7+1.
