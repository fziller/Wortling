# Release Notes — Wortkniff 0.7.0 (Android versionCode 3)

> Ziel: Play Console `Was ist neu` + interne Changelog-Basis. Copy ist auf Deutsch für den Store.

## Kurztext für Google Play (≤500 Zeichen, copy-paste ready)

**Was ist neu in 0.7.0:**
Neu: persönliche Statistiken – lokal auf deinem Gerät. Dazu: Timer pausiert jetzt im Hintergrund, deutlich mehr Wort-Abwechslung bei allen Spielen und klarere Eingabe-Markierung. Viel Spaß beim Kniffeln!

---

## Ausführliche Release Notes (Store-Ansicht & Website)

### Wortkniff 0.7.0 — Mehr Abwechslung, faire Zeit, deine Statistik

**Neu: Persönliche Statistiken – komplett lokal**
- Neuer Bereich **Statistik** in der App.
- Zeigt: Runden gesamt, Lösungsquote, gespielte Tage, Spiele pro Modus, Streaks (aktuell & längster), Spiele nach Wortlänge, häufigste Buchstaben/Wörter und mehr.
- Alles wird als **Rohdaten in SQLite** erfasst (`expo-sqlite`): Sessions, Guesses mit Timing/Reihenfolge, Hints, Outcomes. Keine Guesses oder Antworten gehen an PostHog – Analytics (PostHog) und persönliche Statistik sind strikt getrennt.
- Offline-first: funktioniert ohne Account und ohne Netz. Rohdaten bleiben Source of Truth – künftige Premium-Auswertungen lassen sich rückwirkend berechnen.

**Fix: Zeit läuft nicht mehr im Hintergrund**
- Bisher lief `elapsedSeconds` per Wall-Clock weiter, auch wenn die App im Hintergrund/geschlossen war.
- Jetzt: zentraler `useActiveTimer`-Hook mit `AppState`-Pause. `activeDurationMs` zählt nur aktive Spielzeit. Fix in allen 7 Spielen (Wortleiter, Dazwischen, Galgenwort, Worttreffer, Doppel, Formwort, Wortcode).

**Fix: Ausgewähltes Eingabefeld wieder sichtbar**
- Einheitlicher oranger Rand (`primary #FF6B35`, `primaryLight #FFF1DF` jetzt als Token).
- `wortleiter` nutzt jetzt die globale `LetterInputTiles`-Komponente (Duplikat entfernt).
- `worttreffer` & `Dazwischen` animierte Tiles überschrieben den Rand via Reanimated – jetzt wird `selected` direkt in `useAnimatedStyle` interpoliert, Rand bleibt sichtbar.
- `formwort` hatte gar keinen Active-State – nachgerüstet + Taps zum Cursor-Wechsel freigeschaltet.

**Deutlich mehr Wort-Abwechslung – immer zufällig beim Öffnen**
- Pools massiv vergrößert, ausschließlich sinnvolle DWDS-gefilterte Wörter (kein Wörterbuch-Rauschen):
  - **Formwort:** 23 → ~39.000 (alle 5/6/7 generierten Wörter)
  - **Galgenwort:** 20 → ~10.000+ (4–10 Buchstaben, jetzt ohne Pflicht-Hinweis)
  - **Dazwischen:** 39 → 6.458 (alle 5er)
  - **Worttreffer:** 80 → ~41.000 (alle Längen)
  - **Wortcode:** 46 → ~41.000
  - **Wortleiter:** 365 → 1.500 vorberechnete Leitern (Build-Time BFS, `wortleiter:generate --limit=1500`)
- Alle Spiele wählen beim Öffnen **immer zufällig** (`Math.random`), nicht täglich-seeded. Direktes Wiederholen unwahrscheinlich (z. B. 0,015% bei 6k Pool statt 50% bei 20).

**Technik & Unter der Haube**
- `tokens.color.primaryLight` zentralisiert, Duplikate entfernt (ponytail: Boring over clever).
- Content-Versionen gebumpt (`FORMWORT 3`, `GALGENWORT 2`, `WORTTREFFER 4`, `WORTCODE 3`, `WORTLEITER 2`, `BETWEEN b`) – alte Saves bleiben kompatibel, Tageszuordnung rotiert einmalig.
- `expo-sqlite` Schema mit `game_sessions` / `guesses` / `game_events`, UUIDs, `schemaVersion`/`statsVersion` für spätere Cloud-Sync-Ready-Migration.
- TypeScript & Tests grün (`yarn typecheck`, `vitest` 80/80).

**Hinweis**
- `Doppel` bleibt kuratiert (20 Komposita-Rätsel, Compound-Logik braucht Hints/Erklärung). Erweiterung folgt separat, wenn mehr kuratierte Puzzles bereitstehen.

---

## Interne Checkliste für Play Console

- [ ] `apps/mobile/package.json` → `0.7.0`
- [ ] `apps/mobile/app.json` → `expo.version 0.7.0`, `android.versionCode 3`
- [ ] `yarn content:generate` lief (Wortleiter 1500)
- [ ] `eas build --platform android --profile production` + `eas submit`
- [ ] Diese Notes in Play Console → `Was ist neu` einfügen (Kurztext oben)
- [ ] `docs/product-overview.md` ist bereits aktuell für Stats & Pools – bei diesem Release kein Update nötig (nur bei neuem Spiel/Regeländerung).
