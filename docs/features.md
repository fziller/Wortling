# Wortkniff Feature Guide

This is the human-readable reference for current player-facing behavior. Keep it aligned with the app whenever games, rules, word lengths, difficulty, progression, or other user-facing features change.

## Product at a glance

Wortkniff is an offline-first German word-game app. It provides short daily puzzles and free follow-up rounds without accounts or required network access. Progress, hint balance, and personal statistics stay on the device.

## Puzzle selection and word difficulty

- A round is restored when it is still in progress; otherwise opening a game selects a new curated puzzle.
- The active word-vocabulary setting applies to target selection in supported games:
  - **Klassisch:** familiar base forms; verbs are infinitives and nouns are singular.
  - **Erweitert:** Klassisch plus plurals and conjugated verbs.
  - **Hart:** Erweitert plus participles, subjunctive forms, imperatives, and inflected adjectives. Genitive-only forms are never targets.
- Core targets use curated static German word lists. The classic pool uses a Zipf-frequency threshold of 2.9 for five- to seven-letter words and 2.2 for four-letter words so Wortleiter stays connected.
- The current Biologie word pack exists in the content pipeline, but is not yet presented as an active player option.

## Game modes

| Game | Target and difficulty | Round rules |
| --- | --- | --- |
| **Dazwischen** | Curated five-letter target words. No separate difficulty label. | Enter valid five-letter German words to narrow the target alphabetically. Each guess says whether the target comes before or after it. There is no guess limit. |
| **Galgenwort** | Curated four- to seven-letter words. Eight wrong letters are allowed. | Guess letters from the target word. Correct letters reveal every matching position; each wrong letter uses one of eight mistakes. |
| **Formwort** | Five letters / 6 guesses, six / 7, seven / 8. | Shapes show equal letters before guessing. After a guess, green is exact position, yellow exists elsewhere, gray is absent. |
| **Worttreffer** | Four letters / 5 guesses, five / 6, six / 7, seven / 8. Four-, five-, six-, and seven-letter targets are weighted 15%, 40%, 30%, and 15%. | Wordle-style color feedback: green exact, yellow elsewhere, gray absent. |
| **Wortschmelze** | Fixed eight-letter merged answer; 6 guesses. | Combine two five-letter German words that overlap by two letters. Example: WALZE + ZEBRA becomes WALZEBRA. Color feedback follows Worttreffer. |
| **Wabenwort** | Seven puzzle letters; accepted words have four to twelve letters. | Form words from the honeycomb, always including the center letter. Letters may repeat. Longer words score more and pangrams use all seven letters. Each puzzle defines Bronze, Silber, and Gold thresholds; Gold completes the round. |
| **Wortleiter** | Prepared four-letter word-graph puzzles; difficulty derives from optimal path length. | Change exactly one letter per valid German word until reaching the target. A word cannot repeat in the same ladder. |
| **Wortcode** | Five letters / 7 guesses / easy, six / 8 / medium, seven / 9 / hard. | Mastermind-style counts show exact matches, letters found in another position, and absent letters, without revealing their positions. Players can add manual letter notes. |
| **Doppel** *(currently hidden from Home)* | Curated compound-word puzzles; all current entries are easy. | Find a middle word that forms a valid compound with both shown sides, for example KINDER + SPIEL + PLATZ. Hints unlock length, first letter, then a definition. |

## Hints and round outcomes

- A new installation starts with **three hints**. Hints are global across games and regenerate one every 30 minutes until the balance reaches three.
- Hint behavior is game-specific: most word games reveal a target-letter placeholder; Galgenwort reveals a correct letter; Wortleiter inserts a valid next step; Wabenwort reveals a missing word; Doppel reveals its staged clues.
- Revealing a solution ends the official round without a win. Games with attempt limits allow continued play after an official loss; that later solve does not change the official loss used for streaks and win rates.

## Daily loop and progression

- Every Berlin calendar day, **Tageskniffe** highlights three existing game modes.
- Completing all three gives one completed day and contributes to the local daily streak.
- Home, result screens, and optional notifications point players to the next unfinished Tageskniff.
- In-progress rounds, draft input, and completion state are stored locally. Home exposes a `Weiterspielen` shortcut when relevant.

## Onboarding, help, and feedback

- First-run onboarding explains the Tageskniffe loop.
- Each game opens its rules modal once for players with no local history in that game. The help button in every game header remains available afterwards.
- After a player's first visible result, the app makes one best-effort native App Store or Play Store review request. Settings also contains `App bewerten`; platform quota can suppress either dialog.
- Result screens support spoiler-safe sharing and lightweight difficulty feedback.

## Statistics, reminders, and privacy

- Personal stats are calculated from local SQLite session and guess records. They cover outcomes, attempts, active time, streaks, per-game performance, word/letter stats, and personal records.
- Guess words, solutions, and other personal gameplay content never leave the device through analytics.
- Optional daily and unfinished-Tageskniffe reminders are local notifications. The app remains playable without notification permissions or network access.
