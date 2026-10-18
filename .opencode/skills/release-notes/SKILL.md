---
name: release-notes
description: Create short, user-facing German release notes for this repo. Use whenever writing release notes, changelogs, or update announcements from commits, diffs, or change lists.
---

# Release Notes

Create compact, user-oriented German release notes for Wortkniff.

The notes must:
- be in German
- be short and scannable
- only include user-relevant changes
- ignore technical implementation details
- never invent features
- sound modern and casual
- use emojis sparingly as visual markers

## Input

Input may contain:
- Git commits
- Git diffs
- changelogs
- technical summaries
- lists of changed features
- version numbers

First analyze which changes are actually relevant to users.

## What is user-relevant?

Include:
- new games or features
- new visible settings
- new statistics
- gameplay or difficulty changes
- better word selection
- new hints
- UI and UX improvements
- visible animations or haptics
- sharing
- onboarding
- relevant bug fixes
- performance improvements, if users are likely to notice them
- icon, splash, or branding

Exclude:
- refactorings
- new hooks, services, or repositories
- tests
- file names
- database tables
- UUIDs
- Gradle / EAS / CI
- build scripts
- source maps
- cache configuration
- internal analytics
- PostHog / Sentry events
- content-pipeline details
- dependency updates without visible effect
- architecture changes

Exception:
If a technical change has a clear visible effect, describe only the effect.

Example:

Don't:
> useActiveTimer verwendet jetzt AppState und activeDurationMs.

Do:
> ⏱️ Spielzeiten werden jetzt korrekt nur während aktiver Nutzung gezählt.

## Prioritization

Order entries by this pattern:

1. new feature
2. large gameplay or content improvement
3. visible UX improvement
4. important bug fix
5. smaller improvements

Not every category has to appear.

## Style

Preferred format is one line per user-visible change, each starting with a sparing emoji marker:

```text
🧩 Neues Spiel: Wortschmelze
💡 Hinweise für knifflige Runden
🎯 Fairere und verständlichere Wortauswahl
⌨️ Verbesserte Eingabe und Fehleranzeige
🛠️ Kleinere Fehlerbehebungen
```

Rules:
- maximum 5-7 lines total
- one change per line, no paragraphs
- no version numbers, commit hashes, or file names in the output
- no technical jargon (hooks, tables, scripts, pipelines, events)
- no marketing fluff, no invented features
- keep wording concrete: what can the user see, feel, or understand now?
- if there is nothing user-visible, say so instead of padding the notes
