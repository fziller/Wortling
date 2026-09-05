# Event Tracking Checklist

## Pflicht-Events

Every user-facing screen must emit:

- `screen_viewed`

Every game screen must emit:

- `game_started`
- `game_completed` with `outcome` and `success`
- `game_abandoned`
- `help_opened`
- `solution_revealed` when the solution is shown
- `hint_used` when the game has hints

Daily flow must emit:

- `daily_kniffe_viewed`
- `daily_kniff_opened`
- `daily_kniff_completed`
- `daily_kniffe_all_completed`
- `daily_streak_updated`

Settings must emit:

- `settings_changed`

## Current Coverage

- Home: screen view, Tageskniffe viewed/opened/completed/all completed, streak update.
- Settings: screen view, reminder changes, word bucket changes, pack changes, mock premium changes.
- Stats: screen view.
- Games: screen view, started, completed, abandoned, help opened, solution revealed.
- Hint games: hint used.

## Privacy Rules

- Do not send guesses, answers, target words, or solution words to PostHog.
- Personal stats stay local in SQLite.
- Analytics payloads should only include metadata such as game ID, date key, attempts, duration, outcome, success, word length, difficulty, and hint source.

## Still Missing / Next Events

- Tester feedback after result: `game_feedback_submitted` with `rating: "too_easy" | "ok" | "too_hard"`.
- Share loop: `result_shared` for game result and Tageskniffe share cards.
- Result modal impression: `result_viewed`, useful for measuring completion-to-next-game drop-off.
- First-time help: `first_time_help_shown` if inline onboarding is added.
- Paywall flow, if Premium goes live: `paywall_viewed`, `paywall_purchase_started`, `paywall_purchase_completed`, `paywall_purchase_failed`.
