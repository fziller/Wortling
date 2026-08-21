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

## Word Data

- Keep target words and allowed guesses separate: target words are curated daily solutions; allowed guesses are generated validation/ranking data.
- Word-list import/generation belongs to development/build time, never gameplay runtime.
- Do not add large locale-aware sorts or word-list processing to screen-open paths. Generate sorted data ahead of time and use `Set`/`Map` lookups at runtime.
- Generated word files must not be edited by hand; change the import script or curated target lists instead.
- When word data or rank order changes in a way that affects daily selection or saved progress, bump the affected content version.

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
- When adding new game modes, instrument `game_started`, `game_completed`, `game_abandoned`.
- Source maps are uploaded to Sentry during EAS production builds.

## Checks

Before handing off non-trivial code changes, run from `apps/mobile`:

```bash
yarn typecheck
npx expo-doctor
yarn expo install --check
```

If dependency checks fail because installed Expo/package patch versions are outdated, do not auto-update them unless the current task is dependency maintenance. Mention the mismatch in the handoff instead.
