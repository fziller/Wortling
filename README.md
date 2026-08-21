# Wortling

Wortling is an offline-first German daily word game app. It ships multiple short word puzzles with static word data, local progress, and no account requirement.

## Stack

- Expo 57 + React Native + TypeScript
- Yarn
- Expo Router
- React Native Reanimated
- Development builds via `expo-dev-client`, not Expo Go only

## Development

```bash
cd apps/mobile
yarn install
yarn ios
```

Android:

```bash
cd apps/mobile
yarn android
```

Web preview for quick UI checks:

```bash
cd apps/mobile
yarn web
```

## Scripts

```bash
cd apps/mobile
yarn words:import
yarn words:import:5
yarn words:import:6
yarn test
yarn typecheck
npx expo-doctor
yarn expo install --check
```

## Current Scope

- Game modes: `Dazwischen`, `Doppel`, `Wortcode`, `Worttreffer`
- Shared in-app keyboard for word entry
- Daily puzzles plus practice rounds where supported
- Local curated target words per game
- Generated allowed-guess word lists for validation
- No backend
- No accounts

## Word Data

Word lists are generated at development/build time from the DWDS Lemma Database by DWDS - Digitales Wörterbuch der deutschen Sprache, published by the Berlin-Brandenburg Academy of Sciences and Humanities, plus the German POS Dictionary used by LanguageTool.

Generated word data is checked into the app so gameplay works fully offline. Do not fetch word lists at runtime.

The app separates two kinds of word data:

- Target words are small curated lists used to choose the daily solution.
- Allowed guesses are larger generated lists used to validate input and, for `Dazwischen`, calculate alphabetic rank/position.

For `Dazwischen`, the allowed-guess list must stay sorted at generation time because the game logic depends on stable alphabetic ranks. Avoid large runtime sorts during screen open.

Import commands:

```bash
cd apps/mobile
yarn words:import:5
yarn words:import:6
```

Generated files contain a header and should not be edited by hand. If target lists, generated lists, or ranking order change in a way that affects daily selection or saved progress, bump the relevant content version.

- Source: https://www.dwds.de/lemma/list
- Source: https://github.com/languagetool-org/german-pos-dict
- License: CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/

## Architecture Notes

- Pure game logic lives under `apps/mobile/src/games`.
- React Native screens render state and dispatch user actions.
- Progress is stored locally with AsyncStorage.
- Network-dependent features such as analytics, notifications, and crash reporting must fail silently and never block gameplay.
- Architecture decisions live in `docs/adr/`.
