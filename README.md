# Wortling

Wortling is a mobile-first German daily word game app. The first playable slice is a Betweenle-like mode with five-letter German words.

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
yarn typecheck
npx expo-doctor
yarn expo install --check
```

## Current Scope

- One game mode: `Dazwischen`
- Five-letter words
- Local curated target words
- Small local placeholder guess list
- No backend
- No accounts
- Tests later

## Word Data

The guess list is generated at development/build time from the DWDS Lemma Database by DWDS - Digitales Wörterbuch der deutschen Sprache, published by the Berlin-Brandenburg Academy of Sciences and Humanities, plus the German POS Dictionary used by LanguageTool.

The generated gameplay list is filtered and modified for five-letter word validation. Lemmas come from DWDS; additional noun plural and common verb forms come from the morphology data. Target words remain curated manually.

- Source: https://www.dwds.de/lemma/list
- Source: https://github.com/languagetool-org/german-pos-dict
- License: CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/

## Next Steps

- Save daily progress locally.
- Refine visual design, typography, and motion.
