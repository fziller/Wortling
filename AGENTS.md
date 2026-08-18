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
- Do not add backend, accounts, analytics, or extra game modes unless explicitly requested.
- Prefer existing Expo/React Native APIs before adding dependencies.

## Checks

Before handing off non-trivial code changes, run from `apps/mobile`:

```bash
yarn typecheck
npx expo-doctor
yarn expo install --check
```
