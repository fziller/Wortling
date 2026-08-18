# Wortling

Mobile-first deutsche Daily-Wortspiel-App. Der erste Slice ist ein Betweenle-artiger Modus mit 5-Buchstaben-Woertern.

## Stack

- Expo 57 + React Native + TypeScript
- Yarn
- Expo Router
- React Native Reanimated
- Development Builds via `expo-dev-client`, nicht nur Expo Go

## Start

```bash
cd apps/mobile
yarn install
yarn ios
```

Alternativ Android:

```bash
cd apps/mobile
yarn android
```

Web Preview fuer schnelle UI-Checks:

```bash
cd apps/mobile
yarn web
```

## Aktueller Scope

- Ein Spielmodus: `Dazwischen`
- 5 Buchstaben
- lokale kuratierte Zielwoerter
- kleine lokale Guess-Liste als Platzhalter
- kein Backend
- keine Accounts
- Tests spaeter

## Naechste Schritte

- Deutsche Wortliste automatisiert importieren und auf 5 Buchstaben filtern.
- Fortschritt lokal speichern.
- Design mit finalen Tokens, Typografie und Motion verfeinern.
