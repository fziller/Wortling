**Coding Guide für AI-Agenten**

Technische Leitplanken für eine erweiterbare Daily-Wortspiel-App

# 1. Auftrag an den Coding Agent

Baue eine mobile-first Wortspiel-App als sauberen, erweiterbaren
Vertical Slice. Priorität: funktionierende App, klare Architektur,
hervorragende Interaktion. Nicht das gesamte Produkt auf einmal
implementieren. Nach jedem Meilenstein muss die App ausführbar und
testbar bleiben.

# 2. Empfohlener Stack

- Frontend: React Native + Expo + TypeScript.

- Routing: Expo Router.

- State: zunächst lokale, kleine Stores; Persistenz über AsyncStorage
  oder vergleichbare Expo-kompatible Lösung.

- Animation: React Native Reanimated; Animationen kurz, funktional und
  konsistent.

- Backend: TypeScript Worker/API, bevorzugt Cloudflare Workers; lokale
  Entwicklung muss ohne Cloud-Deployment funktionieren.

- Persistenz Backend: erst hinzufügen, wenn serverseitige
  Daily-Content-Verwaltung nötig wird. Cloudflare D1/KV sind
  naheliegende Kandidaten.

- Tests: Vitest/Jest für reine Game-Engine-Logik; UI-Smoke-Tests dort,
  wo sie hohen Wert liefern.

- Design Exploration: Google Stitch kann als externer
  Design-/Prototyping-Input genutzt werden, ist aber keine
  Runtime-Abhängigkeit. Design Tokens im Code bleiben Source of Truth.

# 3. Architekturprinzip

Jeder Spielmodus ist ein Plugin-artiges Modul. App-Shell, Daily-System,
Persistenz, Design System und Analytics kennen keine modusspezifischen
Regeln.

Vorgeschlagene Struktur:  
apps/mobile  
app/ Screens und Routing  
src/components/ gemeinsame UI  
src/design/ Tokens, Typografie, Motion  
src/games/  
registry.ts  
between/  
engine.ts  
types.ts  
content.ts  
screen.tsx  
tests/  
groups/  
...  
src/daily/ Datum, Seeds, Progress  
src/storage/ lokale Persistenz  
src/analytics/ abstrahierte Events

services/api  
src/routes/  
src/content/  
src/validation/

packages/game-core  
RNG/Seed-Helfer, gemeinsame Game-Typen

packages/content-schema  
Zod/Schema-Definitionen für versionierten Rätsel-Content

# 4. Game Contract

Definiere früh eine kleine Registry-Schnittstelle, damit neue Spiele
nicht Navigation und Home-Screen verändern müssen. Beispielkonzept:

GameDefinition {  
id  
version  
title  
shortDescription  
icon  
createDailyPuzzle(date, content)  
validatePuzzle(puzzle)  
route  
estimatedMinutes  
}

Game-Engines sollen reine TypeScript-Funktionen sein. UI rendert State
und sendet Actions; sie enthält möglichst keine Spielregeln.

# 5. Daily-System

- Ein kanonisches Tagesdatum verwenden, z. B. Europe/Berlin für die
  deutsche Daily-Ausgabe.

- Aus Datum + Game-ID + Content-Version einen deterministischen Seed
  erzeugen.

- Seeded RNG statt Math.random für Daily-Auswahl.

- Puzzle-Version mit gespeichertem Fortschritt persistieren, damit
  Content-Updates laufende Spiele nicht zerstören.

- Entwicklermodus: Datum/Seed überschreibbar machen, damit Rätsel
  reproduzierbar getestet werden können.

# 6. Wortdaten und Content

- Wortliste nicht blind aus einem beliebigen Dictionary übernehmen.
  Flexionen, Eigennamen, Abkürzungen, beleidigende/problematische
  Begriffe und orthografische Varianten bewusst behandeln.

- Zwischen erlaubten Eingabewörtern und möglichen Zielwörtern
  unterscheiden.

- Umlaute und ß nativ darstellen; Normalisierung nur intern und
  eindeutig.

- Content als versionierte Daten behandeln, nicht als lose Strings im
  UI.

- KI darf Content vorschlagen, aber jeder Daily-Content-Typ benötigt
  deterministische Validatoren und bei subjektiven Rätseln einen
  Review-Schritt.

# 7. Backend-Schnitt

MVP 0 kann komplett lokal laufen. Backend erst einführen, wenn es einen
konkreten Nutzen hat. Zielbild:

- GET /v1/daily/:date liefert veröffentlichte
  Puzzle-IDs/Content-Versionen.

- GET /v1/games/:gameId/puzzles/:id liefert versionierten
  Puzzle-Content.

- Optional später: POST /v1/results für anonyme aggregierte
  Completion-Daten.

- Keine personenbezogenen Daten sammeln, solange sie für das Produkt
  nicht nötig sind.

- API-Schemas gemeinsam zwischen Client und Server
  typisieren/validieren.

# 8. Design- und Motion-Regeln

- Design Tokens für Farbe, Radius, Spacing, Typografie und Motion
  anlegen. Keine verstreuten Magic Values.

- Große Touch-Ziele, klare Kontraste, Screenreader-Labels und
  Reduced-Motion berücksichtigen.

- Animationen erklären Zustand: Guess einsortieren, Bereich schrumpfen,
  Erfolg bestätigen. Keine Daueranimation nur zur Dekoration.

- Light Mode zuerst; Dark Mode erst nach stabiler Designsprache.

- Keine visuelle Kopie bestehender Spiele. Mechaniken dürfen vertraut
  sein, Erscheinungsbild muss eigenständig sein.

# 9. Qualitätstore

- TypeScript strict.

- Lint + Format + Unit Tests müssen vor jedem Meilenstein grün sein.

- Game Engine für Dazwischen mit Tests für Grenzen, ungültige Wörter,
  Wiederholungen, Gewinn und Daily-Determinismus.

- Keine Netzwerkabhängigkeit für die erste spielbare Runde.

- Fehlerzustände im UI sichtbar behandeln, nicht verschlucken.

- README enthält Setup, Architekturentscheidungen und nächste Schritte.

# 10. Agenten-Arbeitsweise

1.  Vor jedem Meilenstein kurz den Plan und betroffene Dateien notieren.

2.  Nur den aktuellen Meilenstein implementieren. Keine ungefragten
    späteren Features.

3.  Nach Implementierung Tests/Lint/Typecheck ausführen.

4.  App starten und den primären Flow prüfen.

5.  Änderungen und offene Punkte in einer kurzen Checkpoint-Datei
    dokumentieren.

6.  Erst danach zum nächsten Meilenstein wechseln.
