# Wortkniff – Statistik-Spezifikation

> Status: Living Document  
> Zweck: Produkt- und technische Grundlage für persönliche Spielerstatistiken in Wortkniff

## 1. Ziel

Wortkniff soll Statistiken als echtes Produktfeature behandeln, nicht nur als Sammlung einfacher Counter.

Die Statistik soll:

- Spielern zeigen, wie sie spielen und wie sie sich entwickeln
- Free bereits nützliche Basiswerte liefern
- Premium tiefere Analysen, Historie und persönliche Auswertungen bieten
- lokal und offline funktionieren
- von Anfang an genug Rohdaten sammeln, damit neue Statistiken später rückwirkend berechnet werden können
- später ohne grundlegenden Umbau auf Account- und Cloud-Sync erweitert werden können
- strikt von Produktanalytics wie PostHog getrennt bleiben

Wichtig:

```text
Free und Premium erfassen dieselben Rohdaten.
Premium entscheidet nur darüber, was ausgewertet und angezeigt wird.
```

---

## 2. Free vs. Premium

### Free

Free beantwortet:

> Wie spiele ich insgesamt?

Anzeigen:

- Spiele insgesamt
- gewonnen
- verloren
- aufgedeckt
- abgebrochen
- Lösungsquote
- gespielte Tage
- gesamte aktive Spielzeit
- durchschnittliche aktive Spielzeit
- durchschnittliche Versuche
- durchschnittliche Hinweise
- Spiele pro Modus
- Lieblingsspiel
- aktueller Activity Streak
- längster Activity Streak
- aktueller Win Day Streak
- längster Win Day Streak
- Anzahl Spiele nach Wortlänge
- häufigste Wortlänge
- häufigster verwendeter Buchstabe
- häufigstes geratenes gültiges Wort
- Anzahl unterschiedlicher gültiger Wörter
- Gesamtzahl gültiger Guesses
- ausgewählte persönliche Rekorde

### Premium

Premium beantwortet:

> Was für ein Wortspieler bin ich und wie entwickle ich mich?

Zusätzlich anzeigen:

- Lösungsquote pro Spiel
- Lösungsquote pro Wortlänge
- Lösungsquote pro Schwierigkeit
- Lösungsquote nach Wochentag und Tageszeit
- Entwicklung über 7 / 30 / 90 Tage
- Vergleich mit vorherigen Zeiträumen
- durchschnittliche und mediane Versuche
- Guess-Verteilungen
- detaillierte Streaks
- Activity Heatmap
- komplette Historie
- detaillierte persönliche Rekorde
- Wort-DNA
- Buchstabenverteilung
- Top-Wörter
- Wortanfänge und Wortendungen
- Wortpositionsanalyse
- Vocabulary Metrics
- game-spezifische Tiefenstatistiken

Premium soll keine grundlegenden Werte verstecken, sondern zusätzliche Tiefe bieten.

---

## 3. Was wir messen

Für jede Spielsession möglichst erfassen:

- `gameId`
- Spielversion
- Startzeit
- Abschlusszeit
- kanonisches `playDate`
- Outcome
- Wortlänge
- Schwierigkeit
- Anzahl Versuche
- Anzahl Hinweise
- aktive Spielzeit
- gültige Guesses
- Reihenfolge der Guesses
- Zeitpunkt der Guesses
- doppelte Guesses
- Anzahl ungültiger Eingaben
- Reveal
- Abbruch
- game-spezifische Werte

Mögliche Outcomes:

```ts
type GameOutcome =
  | "won"
  | "lost"
  | "revealed"
  | "abandoned";
```

Nicht messen:

- einzelne Tastendrücke
- Backspaces
- jeden Input-State
- vollständige Texte ungültiger Eingaben
- unnötige personenbezogene Daten

Wir messen semantische Aktionen, keine Keyboard-Telemetrie.

---

## 4. Wort- und Buchstabenstatistiken

Persönliche Wortstatistiken basieren nur auf gültigen, tatsächlich abgeschickten Guesses.

Mögliche Auswertungen:

- häufigste Wörter
- unterschiedliche Wörter
- Unique Guess Ratio
- Wiederholungsrate
- häufigste Startwörter
- häufigste Buchstaben
- selten verwendete Buchstaben
- Buchstabenverteilung A-Z
- Ä / Ö / Ü / ß
- Anfangsbuchstaben
- Endbuchstaben
- Buchstaben nach Position
- häufige Buchstabenpaare
- häufige Wortanfänge
- häufige Wortendungen

Normalisierung:

- trimmen
- case-insensitive vergleichen
- Unicode normalisieren
- Umlaute und ß nativ behalten

Nicht:

```text
ä -> ae
ö -> oe
ü -> ue
ß -> ss
```

Für Wortlänge:

```ts
[...word].length
```

---

## 5. Streaks und Rekorde

### Free-Streaks

- Activity Streak
- längster Activity Streak
- Win Day Streak
- längster Win Day Streak

### Premium-Streaks

- Game Win Streak
- Streak pro Spielmodus
- Hintless Streak
- First-Try Streak
- Perfect Session Streak
- optional später Perfect Day Streak

### Rekorde

Beispiele:

- schnellster Sieg
- wenigste Versuche
- längster Streak
- meiste Spiele an einem Tag
- meiste Siege an einem Tag
- meiste unterschiedliche Wörter an einem Tag
- längste Session
- bester Monat
- beste Woche
- Meilensteine wie 100., 500. oder 1.000. Sieg

Streaks basieren auf `playDate`, nicht auf Daily-Seeds.

---

## 6. Game-spezifische Statistiken

Allgemeine Statistik bleibt game-unabhängig.

Jedes Spiel darf eigene Messwerte liefern.

### Wortcode

Beispiele:

- durchschnittliche Guesses
- Exact Matches pro Guess
- Misplaced Matches pro Guess
- häufigstes Startwort
- erfolgreichstes Startwort
- Guess-Verteilung
- Siege beim letzten Versuch
- Winrate nach Wortlänge
- Winrate nach Schwierigkeit

### Doppel

Beispiele:

- 3-Sterne-Lösungen
- 2-Sterne-Lösungen
- 1-Stern-Lösungen
- Reveals
- durchschnittliche Hinweise
- durchschnittliche Fehlversuche
- Hintless Winrate
- häufigster Hint-Typ
- schnellste Lösung

Neue Spiele sollen eigene Statistikmodule registrieren können, ohne zentrale `if (gameId === ...)`-Logik zu erzeugen.

---

## 7. Technische Architektur

Zielbild:

```text
Game
  ↓
StatsRecorder
  ↓
StatsRepository
  ↓
SQLite
  ↓
Stats Engine
  ↓
Free / Premium UI
```

Game Engines kennen:

- kein SQLite
- keine Premium-Regeln
- keine Statistik-Screens
- keine Cloud-Sync-Details

### StatsRecorder

Zentrale API:

```ts
StatsRecorder.startGame(...)
StatsRecorder.recordGuess(...)
StatsRecorder.recordInvalidGuess(...)
StatsRecorder.recordDuplicateGuess(...)
StatsRecorder.recordHint(...)
StatsRecorder.finishGame(...)
```

### StatsRepository

Alle Reads und Writes laufen über ein Repository.

```ts
statsRepository.createSession()
statsRepository.addGuess()
statsRepository.addEvent()
statsRepository.finishSession()

statsRepository.getLifetimeStats()
statsRepository.getGameStats()
statsRepository.getWordStats()
statsRepository.getHistory()
statsRepository.getRecords()
```

Keine direkten SQL-Queries aus Screens oder Games.

---

## 8. SQLite-Datenmodell

Für Statistiken soll `expo-sqlite` verwendet werden.

### game_sessions

```ts
type GameSession = {
  id: string;

  gameId: string;
  gameVersion: number;

  playDate: string;

  startedAt: string;
  completedAt?: string;

  outcome?: GameOutcome;

  wordLength?: number;
  difficulty?: string;

  attemptCount: number;
  hintCount: number;
  invalidGuessCount: number;
  duplicateGuessCount: number;

  activeDurationMs?: number;

  createdAt: string;
  updatedAt: string;

  schemaVersion: number;
  statsVersion: number;
};
```

### guesses

```ts
type GuessRecord = {
  id: string;
  sessionId: string;

  sequence: number;

  word?: string;
  normalizedWord?: string;
  wordLength?: number;

  submittedAt: string;
  elapsedMs?: number;

  valid: boolean;
  duplicate: boolean;

  gameData?: string;

  createdAt: string;
  updatedAt: string;

  schemaVersion: number;
};
```

### game_events

Für zusätzliche semantische Events:

```ts
type GameEvent = {
  id: string;
  sessionId: string;

  type:
    | "game_started"
    | "guess_submitted"
    | "invalid_guess"
    | "duplicate_guess"
    | "hint_used"
    | "game_won"
    | "game_lost"
    | "game_revealed"
    | "game_abandoned";

  timestamp: string;
  metadata?: string;

  createdAt: string;
  schemaVersion: number;
};
```

---

## 9. Raw Data, Derived Stats und Cache

Rohdaten sind die Source of Truth.

Nicht nur speichern:

```ts
wins: 814
```

sondern die Sessions, aus denen sich diese Zahl ergibt.

Dadurch können neue Statistiken später rückwirkend berechnet werden.

Derived Stats sind zum Beispiel:

- Winrate
- durchschnittliche Versuche
- Median
- Lieblingsspiel
- häufigster Buchstabe
- häufigstes Wort
- Streaks
- Rekorde
- Trends

Teure oder häufig benötigte Berechnungen dürfen gecacht werden.

Beispiel:

```text
statistics_cache
```

Raw Data bleibt trotzdem immer die Quelle.

---

## 10. Aktive Spielzeit

Nicht einfach:

```ts
completedAt - startedAt
```

verwenden.

Wenn die App im Hintergrund ist, darf diese Zeit nicht als Spielzeit zählen.

Deshalb:

```ts
activeDurationMs
```

Der Timer pausiert im Background und läuft nur während tatsächlich aktiver Spielzeit.

Damit bleiben Zeitstatistiken sinnvoll.

---

## 11. Cloud- und Account-Readiness

SQLite bleibt zunächst vollständig local-first.

Die Architektur soll aber später Cloud-Sync erlauben.

### UUIDs

Keine Auto-Increment-IDs als globale Identität.

```ts
id: crypto.randomUUID()
```

für:

- Sessions
- Guesses
- Events

### Sync-fähige Basisfelder

```ts
type SyncableEntity = {
  id: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
};
```

Später optional:

```ts
userId?: string;
deviceId?: string;
deletedAt?: string;
```

### Späterer Account-Flow

```text
lokale Historie vorhanden
↓
Account wird verbunden
↓
lokale Daten hochladen
↓
Cloud-Daten herunterladen
↓
UUID-Deduplizierung
↓
SQLite enthält vollständige Historie
```

Ein Nutzer kann also monatelang ohne Account spielen und später trotzdem seine gesamte Statistik übernehmen.

### Device-Wechsel

```text
Login
↓
Cloud Sync
↓
Sessions / Guesses / Events herunterladen
↓
SQLite befüllen
↓
Statistiken lokal neu berechnen
```

Auch mit Cloud bleibt SQLite die primäre lokale Datenquelle.

---

## 12. PostHog-Trennung

Persönliche Statistik und Produktanalytics sind zwei verschiedene Systeme.

### Lokal

Detailliert und für den Nutzer:

```text
STEIN wurde 24-mal geraten
E wurde 1.842-mal verwendet
Wortcode braucht durchschnittlich 4,2 Guesses
```

### PostHog

Aggregiert und für Produktentscheidungen:

```text
game_started
game_completed
game_abandoned
hint_used
premium_stats_opened
```

Properties:

```text
game_id
outcome
word_length
difficulty
attempt_count
hint_count
active_duration_bucket
```

Nicht an PostHog senden:

```text
guess = "STEIN"
answer = "RINDE"
```

PostHog beantwortet Fragen wie:

- Wie viele Nutzer spielen welches Spiel?
- Welche Modi werden häufig abgebrochen?
- Welche Wortlängen werden gespielt?
- Starten Nutzer danach noch ein weiteres Spiel?
- Wie oft werden Hinweise genutzt?

---

## 13. Implementierungsreihenfolge

### Phase 1 – Fundament

- `expo-sqlite`
- Migrationen
- `game_sessions`
- `guesses`
- `game_events`
- UUIDs
- `schemaVersion`
- `statsVersion`
- StatsRecorder
- StatsRepository

### Phase 2 – Games anbinden

Alle Spiele verwenden zentrale Statistik-Events.

Keine direkten DB-Zugriffe aus Game-Modulen.

### Phase 3 – Free Stats

Implementieren:

- Lifetime Summary
- Spiele pro Modus
- Outcomes
- Streaks
- Wortlängen
- aktive Spielzeit
- häufigster Buchstabe
- häufigstes Wort
- einfache Rekorde

### Phase 4 – Premium Stats

Implementieren:

- Zeiträume
- Trends
- Wort-DNA
- Heatmap
- detaillierte Rekorde
- Performance-Analyse
- game-spezifische Detailstatistiken

### Phase 5 – PostHog

Produktanalytics separat instrumentieren.

### Phase 6 – Cloud Sync

Erst wenn Accounts einen echten Nutzen bieten.

---

## 14. Leitentscheidungen

Für zukünftige Statistikideen gelten diese Regeln:

1. Rohdaten möglichst vollständig und lokal erfassen.
2. Nur semantische Aktionen messen.
3. Free und Premium verwenden dieselbe Datengrundlage.
4. Premium monetarisiert Tiefe, Historie und Analyse.
5. Berechenbare Werte nicht unnötig doppelt persistieren.
6. Rohdaten langfristig behalten.
7. Game-spezifische Daten bleiben modular.
8. Persönliche Statistiken und PostHog strikt trennen.
9. SQLite bleibt local-first.
10. Cloud ergänzt später die lokale Datenbank, ersetzt sie nicht.
11. Neue Datenstrukturen müssen versionierbar und migrierbar sein.
12. Neue Statistikideen sollen möglichst aus bereits vorhandenen Rohdaten ableitbar sein.
