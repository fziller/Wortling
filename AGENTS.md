# Agent Instructions

## Project

Wortkniff is an Expo + React Native + TypeScript mobile app for German daily word games. Do not use Godot for this project.

## Rules

- Use Yarn for package management.
- Keep game logic as pure TypeScript functions under `apps/mobile/src/games`.
- Keep React Native screens focused on rendering state and dispatching user actions.
- Do not fetch word lists at runtime in the mobile app; generate static word data at development/build time.
- Keep user-facing game text in German unless the product direction changes.
- Write README, agent-facing docs, and code comments in English.
- Keep `docs/product-overview.md` updated when adding games, changing game rules, or shipping user-facing features.
- Do not add backend, accounts, or extra game modes unless explicitly requested.
- Prefer existing Expo/React Native APIs before adding dependencies.
- Only change dependencies when the user explicitly asks for it, or when a bug fix or requested feature genuinely requires a package/version change. Do not update packages just to make hygiene checks pass; report that as separate maintenance instead.
- Aim to keep files around 300 lines when touching them, splitting into smaller components/modules where it improves readability. This is a soft guideline, not a hard limit; slightly larger files are fine when splitting would add noise. Generated files and static data files are exempt.

## Game UI

- Build word-game screens with `GameScreenFrame` so header, content, actions, and keyboard stay consistent.
- Keep game content in the frame content area, never underneath the header or keyboard.
- Keep game keyboard controls in the frame keyboard/footer area so bottom safe area handling stays centralized.
- Put small per-game actions like `Lösung anzeigen`, `Hinweis`, or `Zurück` in the frame action row above the keyboard.
- Do not add explanatory game-rule copy directly into gameplay content; use the help modal for rules and reserve content text for concrete feedback, hints, or results.
- Never use horizontal scrolling for gameplay letter tiles or word boards; shrink tile width, gaps, or type instead so the full puzzle remains visible.
- Animate all interactive state changes (toggles, switches, buttons) smoothly with `react-native-reanimated` — no hard on/off jumps. Use spring (`damping ~18, stiffness ~220`) or timing (180-220ms) for track color and knob position.

## Animations & Polish

- Animation is an acceptance criterion for every UI change. When adding or modifying interactive elements, verify on device that transitions are smooth and not snapping.
- Challenge new tasks that lack animation consideration: ask whether a toggle, modal, tile, or navigation needs a spring/timing transition before marking done.
- Keep animations offline-friendly and lightweight (Reanimated worklets only, no JS-thread jank).

## Word Data

- Keep target words and allowed guesses separate: target words are curated daily solutions; allowed guesses are generated validation/ranking data.
- Word-list import/generation belongs to development/build time, never gameplay runtime.
- Do not add large locale-aware sorts or word-list processing to screen-open paths. Generate sorted data ahead of time and use `Set`/`Map` lookups at runtime.
- Generated word files must not be edited by hand; change the import script or curated target lists instead.
- New game word-import or content-generation scripts must be wired into `apps/mobile/package.json` via `content:generate`, so app builds and OTA updates refresh generated game data automatically.
- When word data or rank order changes in a way that affects daily selection or saved progress, bump the affected content version.

## Statistics

- Personal statistics are a first-class product feature. Every new game and every new gameplay feature must consider stats collection from day one — never ship a feature that bypasses it.
- All games report through the central recorder (`apps/mobile/src/stats/recorder.ts`, `useGameRecorder`): `start()` on first semantic action, `recordAcceptedGuess`/`recordRejectedGuess` per submission, `recordHint()` for hints, `finish(outcome)` on round end. Never call SQLite from games or screens directly.
- Game-specific metrics belong in guess `gameData` payloads or event metadata, so future premium analytics can compute them retroactively from raw data.
- Raw data is the source of truth: do not persist derived counters when the value is computable from existing rows (spec: docs/Wortkniff_Statistik_Spezifikation_Kompakt.md).
- Personal stats stay strictly local (SQLite). Never send guess words, answers, or other personal gameplay content to PostHog.

## Offline-First

- The app must function fully offline. Word lists are static (generated at build time), progress is stored in AsyncStorage.
- Never add runtime network calls that are required for gameplay.
- Network-dependent features (Sentry, PostHog, OTA updates) must degrade gracefully — queue or silently fail, never crash.
- All new network-related code must be wrapped in try-catch with a no-op fallback.
- If an analytics call or error report fails, the app must continue as if nothing happened.

## Monitoring & Analytics

- Sentry and PostHog are active. When modifying app flow, ensure:
  - Error boundaries catch React render errors (Sentry picks these up automatically).
  - Analytics events are fired for key user actions (game start/complete/abandon, settings changes).
  - No secrets (DSN, API keys) are hardcoded — use `EXPO_PUBLIC_` env vars.
- When adding new screens, fire a `screen_viewed` PostHog event.
- When adding new game modes, instrument `screen_viewed`, `game_started`, `game_completed`, `game_abandoned`, `help_opened`, `solution_revealed`, and `hint_used` if hints exist.
- `game_completed` must include an outcome and whether the round was successful, so wins, losses, and revealed solutions can be compared consistently.
- When adding new user-facing functionality, add the smallest useful event for key actions such as settings changes, hints, result sharing, feedback, paywall actions, and daily streak completion.
- Never send guess words, answers, target words, or other personal gameplay content to PostHog; keep that data local in SQLite.
- Source maps are uploaded to Sentry during EAS production builds.

## News / Update Modal

- A versioned one-time news modal already exists under `apps/mobile/src/news`.
- Keep it inactive by default with `currentNews = null` in `apps/mobile/src/news/current.ts`.
- To announce an update, set `currentNews` to a new `{ id, title, body, bullets }` object. Use a new `id` for each user-facing announcement.
- Home shows onboarding before news and never stacks both modals.
- Development builds can reset the seen state from Settings; do not expose this in production.

## Checks

Before handing off non-trivial code changes, run from `apps/mobile`:

```bash
yarn typecheck
npx expo-doctor
yarn expo install --check
```

If dependency checks fail because installed Expo/package patch versions are outdated, do not auto-update them unless the current task is dependency maintenance. Mention the mismatch in the handoff instead.
