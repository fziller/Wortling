# Agent Instructions

## Project

Wortling is an Expo + React Native + TypeScript mobile app for German daily word games. Do not use Godot for this project.

## Rules

- Use Yarn for package management.
- Keep game logic as pure TypeScript functions under `apps/mobile/src/games`.
- Keep React Native screens focused on rendering state and dispatching user actions.
- Do not fetch word lists at runtime in the mobile app; generate static word data at development/build time.
- Keep user-facing game text in German unless the product direction changes.
- Write README, agent-facing docs, and code comments in English.
- Do not add backend, accounts, or extra game modes unless explicitly requested.
- Prefer existing Expo/React Native APIs before adding dependencies.

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
