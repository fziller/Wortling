# Wortkniff

Wortkniff is an offline-first German daily word game app. It ships multiple short word puzzles with static word data, local progress, and no account requirement.

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

- Game modes: `Dazwischen`, `Doppel`, `Galgenwort`, `Formwort`, `Worttreffer`, `Wortcode`
- Shared in-app keyboard for word entry
- Daily puzzles plus practice rounds where supported
- Local curated target words per game
- Generated allowed-guess word lists for validation
- No backend
- No accounts

See `docs/product-overview.md` for the maintained product overview.

## Word Data

Word lists are generated at development/build time from the DWDS Lemma Database by DWDS - Digitales Wörterbuch der deutschen Sprache, published by the Berlin-Brandenburg Academy of Sciences and Humanities, plus the German POS Dictionary used by LanguageTool. SUBTLEX-DE frequency data selects common Core solutions.

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

### Core word review

Core solutions must be common SUBTLEX-DE words and pass the English-word review policy. English-only matches and ambiguous German/English matches are excluded automatically. A manual `keep-*` decision is required to restore any excluded word. The review uses the [FrequencyWords English 50k list](https://github.com/hermitdave/FrequencyWords) (MIT) only at development time.

```bash
cd apps/mobile
yarn content:generate             # regenerates reports and validates every Core target
yarn words:review:generate        # writes scripts/reports/word-review/*.tsv
yarn words:review:decide --word=chat --decision=keep-target --note="Established German usage"
yarn content:generate
```

`scripts/data/word-review-overrides.tsv` is the checked-in source of manual decisions. `keep-target` permits a word as a solution and guess, `keep-allowed` permits guesses only, and `block` always removes it. Manual decisions override automatic classification. The generated `rejected-english.tsv` and `needs-review.tsv` reports are ignored by Git; do not edit them as source data.

#### Decide a word

Open the generated reports after `yarn words:review:generate`:

| Report | Meaning | What to do |
| --- | --- | --- |
| `scripts/reports/word-review/rejected-english.tsv` | Automatically blocked English-only or ambiguous candidate. | Leave it blocked, or add an override for an established German usage. |
| `scripts/reports/word-review/needs-review.tsv` | German and English frequency data conflict while review mode is enabled. Current strict policy blocks these entries, so this should normally be empty. | Add `keep-target`, `keep-allowed`, or `block` if review mode is enabled later. |
| `scripts/reports/word-review/manual-decisions.tsv` | Current persisted `keep-*` decisions. | Check that the override has the intended scope. |

Never edit a report: it is regenerated. Persist a decision with the command below, which writes or updates one row in `scripts/data/word-review-overrides.tsv`:

```bash
# Common German word: allow as a Core solution and a guess.
yarn words:review:decide --word=chat --decision=keep-target --note="Established German usage"

# Valid input, but never show it as a solution, hint, pangram, or rank word.
yarn words:review:decide --word=hash --decision=keep-allowed --note="Established German loanword"

# Always remove the word, even if a source lists it.
yarn words:review:decide --word=need --decision=block --note="English corpus noise"
```

The TSV is intentionally plain text and can also be edited directly. Keep its header and use exactly three tab-separated columns:

```tsv
word	decision	note
chat	keep-target	Established German usage
hash	keep-allowed	Established German loanword
need	block	English corpus noise
```

Then regenerate every dependent list and puzzle. The generator fails if a Core target or curated Wabenwort word violates the policy:

```bash
yarn content:generate
```

- Source: https://www.dwds.de/lemma/list
- Source: https://github.com/languagetool-org/german-pos-dict
- English review source: https://github.com/hermitdave/FrequencyWords (MIT)
- License: CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/

## Architecture Notes

- Pure game logic lives under `apps/mobile/src/games`.
- React Native screens render state and dispatch user actions.
- Progress is stored locally with AsyncStorage.
- Network-dependent features such as analytics, notifications, and crash reporting must fail silently and never block gameplay.
- Architecture decisions live in `docs/adr/`.
