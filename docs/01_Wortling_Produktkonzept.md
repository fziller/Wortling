**Wortling – Produktkonzept**

Produktvision, Zielgruppe, Spielmodi und MVP-These

# 1. Kurzfassung

**Wortling** ist eine hochwertige, deutschsprachige Daily-Wortspiel-App
bündelt mehrere kurze, moderne Rätsel in einem einzigen Produkt. Statt
für Betweenle-, Semantik-, Gruppen- oder Wortketten-Spiele jeweils eine
eigene App zu benötigen, bekommt der Nutzer jeden Tag eine kleine
kuratierte Spielrunde. Der Kern ist nicht ein völlig neues Einzelspiel,
sondern die Kombination aus Auswahl, guter Gestaltung, geringer Reibung
und regelmäßigem Wiederkommen.

# 2. Produktthese

Es gibt viele einzelne Wortspiele und einige Puzzle-Sammlungen. Die
Chance liegt deshalb nicht in „noch einem Wordle“, sondern in einem
fokussierten deutschsprachigen Produkt mit mehreren starken
Wortspiel-Mechaniken, moderner Oberfläche und einer klaren
Daily-Routine.

- 3 bis 5 Minuten pro täglicher Runde statt endloser Grind.

- Mehrere Spielmodi unter einem Dach, ohne Sudoku-, Kreuzwort- oder
  Brain-Training-Ballast.

- Deutsch als Produktkern: Wortschatz, Komposita, Mehrdeutigkeit und
  sprachliche Besonderheiten.

- Sehr wenig visuelle Assets; Wert entsteht aus Mechanik, Text, Motion
  Design und Content-Qualität.

- Werbung später zurückhaltend einsetzen; zuerst Retention und Spielspaß
  beweisen.

# 3. Zielgruppe

| **Segment**          | **Bedürfnis**                             | **Produktantwort**                       |
|----------------------|-------------------------------------------|------------------------------------------|
| Daily-Puzzle-Spieler | Kurze tägliche Denkaufgabe                | Eine kompakte Runde mit Streak und Share |
| Wortspiel-Fans       | Abwechslung statt einer einzigen Mechanik | Mehrere Wortspieltypen in einer App      |
| Casual-Spieler       | Sofort verstehen, keine Lernkurve         | Ein-Satz-Regeln und direkte Interaktion  |
| Sprachinteressierte  | Cleveres Spiel mit deutscher Sprache      | Komposita, Bedeutungen, Wortbeziehungen  |

# 4. UX-Prinzipien

- Starten statt konfigurieren: App öffnen, heutige Spiele sehen,
  antippen, spielen.

- Jeder Modus muss in höchstens zwei Sätzen erklärbar sein.

- Bunt und lebendig, aber nicht billig: klare Typografie, großzügige
  Flächen, subtile Animationen und Haptik.

- Fehler dürfen sich nicht wie Bestrafung anfühlen. Feedback soll
  informativ und befriedigend sein.

- Daily zuerst, Endless/Archiv später.

- Kein Account-Zwang im MVP.

# 5. Geplante Spielmodi

## Dazwischen (MVP \#1)

Ein deutsches Zielwort wird alphabetisch eingegrenzt. Jeder gültige
Versuch zeigt, ob das Ziel davor oder danach liegt. Der sichtbare
Suchraum schrumpft. Sehr geringe Content-Kosten und ideal als erster
technischer Vertical Slice.

## Vierer / Gruppen (MVP \#2)

16 Wörter müssen in vier Gruppen zu je vier zusammengehörigen Begriffen
sortiert werden. Content benötigt redaktionelle Qualität, eignet sich
aber hervorragend für Daily-Rätsel.

## Wortkette / Komposita (Kandidat \#3)

Spieler vervollständigen eine Kette aus zusammengesetzten deutschen
Wörtern oder finden ein Bindeglied, das mit zwei Nachbarwörtern gültige
Begriffe bildet.

## Semantische Nähe (später)

Ein Zielwort wird über Bedeutungsnähe gefunden. Technisch mit
vorberechneten Embeddings möglich, aber nicht als erstes Feature, weil
Datenqualität und Modellwahl zusätzlichen Aufwand verursachen.

## Außenseiter (später)

Mehrere Wörter teilen eine Eigenschaft, eines passt nicht. Der Reiz
entsteht aus guten, gelegentlich doppeldeutigen Kategorien.

## Hinweisleiter (später)

Das Zielwort wird über schrittweise konkretere Hinweise erraten. Weniger
Hinweise bedeuten mehr Punkte.

# 6. Daily Loop

1.  App öffnen und die heutige Spielkarte sehen.

2.  Spielmodus auswählen und eine Runde in 1 bis 3 Minuten spielen.

3.  Direktes Ergebnis mit Versuchen, Zeit oder Score erhalten.

4.  Weitere heutige Modi spielen.

5.  Tagesabschluss: X/Y geschafft, Streak, persönliche Statistik und
    teilbares Ergebnis.

6.  Am nächsten Tag neue Rätsel.

# 7. MVP

Das MVP soll bewusst klein sein. Ziel ist nicht, das endgültige Produkt
zu bauen, sondern die Produktwirkung in der Hand zu testen.

- Mobile-first App mit Home/Daily-Screen.

- Spielmodus 1: Dazwischen, vollständig spielbar.

- Lokale Daily-Seeds und lokaler Fortschritt.

- Kleine kuratierte deutsche Wortliste plus Validierung gültiger
  Eingaben.

- Streak/Statistik zunächst lokal.

- Polierte Motion- und Feedback-Grundsprache.

- Architektur mit Game Registry, damit weitere Modi ohne Umbau ergänzt
  werden können.

- Spielmodus 2 ist architektonisch vorgesehen, wird aber erst nach dem
  ersten spielbaren Slice implementiert.

# 8. Erfolgskriterien

- Ein neuer Nutzer versteht das erste Spiel ohne Tutorial-Overkill.

- Eine Runde fühlt sich nach wenigen Sekunden reaktionsschnell und
  hochwertig an.

- Der Nutzer möchte unmittelbar einen zweiten Modus ausprobieren.

- Daily-Rätsel sind deterministisch und für alle Nutzer am selben Tag
  identisch.

- Neue Modi lassen sich als isolierte Module ergänzen.

- Erst nach internem Spieltest entscheiden, ob Distribution und
  Monetarisierung sinnvoll sind.

# 9. Monetarisierungshypothese

Monetarisierung ist im MVP kein Primärziel. Später denkbar: dezente
Werbung zwischen abgeschlossenen Sessions, einmaliger Werbefrei-Kauf
oder Premium für Archiv/Endless. Keine Interstitials mitten im Rätsel
und keine aggressive Coin-Ökonomie.

# 10. Was ausdrücklich nicht gebaut wird

- Kreuzworträtsel-Plattform

- Sudoku/Nonogramm-Sammlung

- Social Network

- Account- und Profilkomplexität im MVP

- KI-generierte Rätsel ohne Validierung

- Großes CMS vor dem Nachweis, dass die Spiele Spaß machen
