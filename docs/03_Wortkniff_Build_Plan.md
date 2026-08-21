**Schritt-für-Schritt Build Plan**

Vom leeren Repository zum testbaren Wortspiel-MVP

# Leitregel

Nicht vorausbauen. Jeder Schritt endet mit einem sichtbaren,
ausführbaren Ergebnis und einem Go/No-Go. Wenn ein Spiel keinen Spaß
macht, wird nicht durch zusätzliche Features versucht, es zu retten.

# Phase 0 – Produkt- und Design-Spike

- Repo initialisieren, README und Entscheidungslog anlegen.

- 2–3 visuelle Richtungen als statische Screens/Prototypen explorieren;
  optional Google Stitch für schnelle Varianten verwenden.

- Eine Designsprache auswählen und als Tokens dokumentieren.

- Definition of Done: Home-Screen und Dazwischen-Screen sind als
  klickbarer/statischer Prototyp verständlich.

**Checkpoint:** Go, wenn die Oberfläche eigenständig und mobil sofort
verständlich wirkt.

# Phase 1 – Laufende App-Shell

- Expo/TypeScript-Projekt aufsetzen.

- Routing, Theme/Tokens, gemeinsame Buttons/Cards/Headers
  implementieren.

- Home-Screen mit einer aktiven Karte 'Dazwischen' und Platzhaltern für
  kommende Spiele.

- Lokale Persistenz-Grundlage und Developer-Menü vorbereiten.

- Definition of Done: App startet lokal auf iOS/Android/Web-Preview und
  Navigation funktioniert.

**Checkpoint:** Noch kein Backend und keine zweite Game Engine.

# Phase 2 – Dazwischen als Vertical Slice

- Kuratiertes kleines deutsches Zielwort-Set und größere Guess-Liste
  einbinden.

- Reine Game Engine implementieren: alphabetische Ordnung, Bounds,
  Guess-Validierung, Win/Loss.

- Daily Seed und reproduzierbare Puzzle-Auswahl bauen.

- Spiel-UI mit Eingabe, Feedback, animiert schrumpfendem Bereich und
  Abschlusszustand bauen.

- Unit Tests für Engine und Daily-Determinismus schreiben.

- Definition of Done: Eine komplette Daily-Runde funktioniert offline
  und fühlt sich poliert an.

**Checkpoint:** Go nur, wenn man freiwillig mehrere Test-Runden spielen
möchte.

# Phase 3 – Lokale Daily-Routine

- Fortschritt pro Tag speichern.

- Streak und einfache Statistik ergänzen. Ein Streak-Tag zählt nur, wenn
  alle drei Tageskniffe final abgeschlossen wurden.

- Share-Text/Share-Grid erzeugen, ohne Lösung zu verraten.

- Home-Screen zeigt Tageskniffe mit Status: offen, begonnen, geschafft.

- Definition of Done: Nutzer kann die App an mehreren simulierten Tagen
  sinnvoll verwenden.

**Checkpoint:** Noch kein Login, Leaderboard oder Monetarisierung.

# Phase 4 – Content- und Backend-Fundament

- Content-Schemas versionieren und Validatoren implementieren.

- Lokale API/Worker-Struktur erstellen.

- Endpoint für Daily-Manifest implementieren; lokale Fallback-Daten
  beibehalten.

- Deployment optional zuerst auf Cloudflare Workers; Fly.io nur wählen,
  wenn ein langlebiger Serverprozess/Container wirklich nötig wird.

- Definition of Done: derselbe Client kann lokale oder remote
  bereitgestellte Daily-Inhalte laden.

**Checkpoint:** Backend muss einen echten Vorteil liefern, sonst Phase
überspringen.

# Phase 5 – Zweiter Modus: Vierer/Groups

- Groups Engine als unabhängiges Game-Modul implementieren.

- Content-Schema: 16 Begriffe, vier Gruppen, Lösungen, Labels,
  Schwierigkeit, Erklärungen.

- Validator: keine Duplikate, exakt 4×4, alle Wörter eindeutig
  zugeordnet.

- 10–20 handgeprüfte Rätsel erstellen; KI nur als Ideengeber.

- Game Registry/Home-Screen muss den neuen Modus ohne Sonderlogik
  aufnehmen.

- Definition of Done: zwei Modi teilen Shell/Daily/Storage, aber keine
  Spielregeln.

**Checkpoint:** Hier zeigt sich, ob die Architektur wirklich erweiterbar
ist.

# Phase 6 – Interner Produkttest

- 20–50 Personen oder ein kleiner geschlossener Testkreis.

- Messen: Start → Abschluss, zweiter Modus gestartet, Wiederkehr am
  Folgetag, D7-Retention, Abbruchstellen.

- Qualitatives Feedback: 'Welches Spiel würdest du morgen wieder
  spielen?' und 'Was nervt?'.

- Keine Werbung in diesem Test.

- Definition of Done: Entscheidung anhand Verhalten, nicht anhand
  Komplimenten.

**Checkpoint:** Kill/iterate/continue bewusst entscheiden.

# Phase 7 – Dritter Modus und Content-Pipeline

- Nur bei positiver Retention einen dritten Modus bauen, bevorzugt
  Wortkette/Komposita.

- Kleine interne Content-Workbench oder Scripts bauen, nicht sofort ein
  großes CMS.

- KI-Generierung + Validator + menschliche Freigabe als Pipeline testen.

- Archiv/Endless erst jetzt evaluieren.

**Checkpoint:** Content-Qualität vor Quantität.

# Phase 8 – Distribution und Monetarisierung

- Store Assets, Datenschutz, Crash Reporting und minimale Analytics
  produktionsreif machen.

- Monetarisierung A/B-denken: Werbefrei-Kauf, Premium-Archiv oder sehr
  dezente Ads.

- Keine Werbung zwischen Guess und Feedback oder während eines aktiven
  Rätsels.

- Erst jetzt App-Store-/Play-Store-Launch planen.

**Checkpoint:** Monetarisierung darf die Daily-Routine nicht
beschädigen.

# Priorisierte Backlog-Ideen nach dem MVP

| **Priorität** | **Feature/Modus**     | **Warum**                           | **Nicht vorher, weil**                       |
|---------------|-----------------------|-------------------------------------|----------------------------------------------|
| P1            | Wortkette / Komposita | Deutsch-spezifische Differenzierung | Mechanik erst mit echten Testern validieren  |
| P1            | Daily Share           | Organische Verbreitung              | Erst wenn Ergebnisse stabil sind             |
| P2            | Archiv                | Mehr Nutzungszeit                   | Daily-Retention wichtiger                    |
| P2            | Semantische Nähe      | Beliebte Mechanik                   | Embeddings und Datenqualität erhöhen Aufwand |
| P2            | Hinweisleiter         | Content-leicht und verständlich     | Nicht nötig für ersten Architekturtest       |
| P3            | Endless               | Mehr Sessions                       | Kann Daily-Fokus verwässern                  |
| P3            | Accounts/Cloud Sync   | Gerätewechsel/Community             | Komplexität ohne frühen Produktnutzen        |
| P3            | Leaderboards          | Wettbewerb                          | Cheating, Datenschutz und Fairness           |

# Entscheidungsmetriken

Keine harten Markt-Benchmarks vortäuschen. Für den ersten Test reichen
relative Signale. Besonders wichtig: Anteil der Spieler, die ein
begonnenes Rätsel beenden; Anteil, der am selben Tag einen zweiten Modus
startet; D1/D7-Wiederkehr; freiwillige Shares; qualitative Präferenz pro
Modus. Wenn Wiederkehr schwach ist, zuerst Mechanik und UX untersuchen,
nicht mehr Content hineinschütten.
