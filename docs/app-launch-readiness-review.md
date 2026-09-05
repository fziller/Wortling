# Wortkniff App Launch Readiness Review

## Kurzurteil

Wortkniff ist stärker als viele kleine Wortspiel-Apps, weil die App deutsch-first, offline, accountfrei und nicht nur ein einzelner Wordle-Klon ist. Vor dem Livegang braucht sie weniger neue Features und mehr polish an den Momenten, die Retention treiben: Erfolg, Tagesabschluss, klare Einstiege und messbares Testerfeedback.

## Vergleichbare Apps

- Wordle / NYT Games: extrem klarer Daily Loop, starker Share-Moment, einfache Ergebnislogik.
- Puzzmo / kleine Puzzle-Sammlungen: mehrere Modi, kuratierte Auswahl, Daily-Ritual statt endloser Content-Flut.
- Klassische Wortspiel-Apps: oft viel Content, aber viel Werbung, wenig Vertrauen, schwache Produktidentität.
- Deutsche Wortspiel-Apps: meist stark in Wörterbuch/Training, aber selten modern im Daily-Game-Gefühl.

## Was Wortkniff besser macht

- Deutsch ist nicht nur Übersetzung, sondern Produktkern: Komposita, Wortleiter, Dazwischen und Wortcode nutzen Sprache wirklich.
- Mehrere kurze Modi unter einem Dach geben Abwechslung, ohne direkt eine generische Brain-Training-App zu werden.
- Offline-first, kein Account und lokale Statistik sind ein sympathischer Gegenentwurf zu datenhungrigen Casual-Apps.
- Die Wortdaten-Pipeline mit statischen Listen, kuratierten Targets und getrennten allowed guesses ist solide für faire Runden.
- Die visuelle Sprache mit Papier, Tape, warmen Farben und klaren Karten wirkt eigenständig.
- Persönliche lokale Statistik ist für den App-Stand überdurchschnittlich tief.

## Wo Wortkniff aktuell danebenliegt

- Der Erfolgsmoment ist oft zu trocken: Modal, Lösung, ein paar Stats. Funktioniert, aber kickt noch nicht.
- Acht sichtbare Spiele können neue Nutzer erschlagen. Tageskniffe helfen, aber Home braucht klarer den Hauptpfad.
- Erklärungen sitzen stark im Help-Modal. Gute Puzzle-Apps erklären zusätzlich über die erste Interaktion.
- Share-/Ritual-Loop fehlt sichtbar. Daily Games leben davon, dass ein Abschluss teilbar und erinnerbar ist.
- Event Tracking ist für den Launch-Funnel weitgehend geschlossen. In der Beta müssen vor allem Result-Views, Shares und Feedback ausgewertet werden.
- Doppel hat zu wenig Content-Tiefe für sichtbaren Launch-Pool und wird deshalb vorerst versteckt.

## Vor Live Nachziehen

- Einheitliches Event Tracking in der Beta beobachten: Start, Ende, Erfolg, Fail, Abbruch, Hilfe, Hinweis, Lösung anzeigen, Result-View, Feedback, Share.
- Minimaler Tester-Feedback-Prompt nach Ergebnissen: `zu leicht`, `passt`, `zu schwer`.
- Ergebnis-Momente sind mit Reanimated-Reward, Sticker, animierter Lösung, Stats und Papier-Schnipseln aufgewertet. Rekord-/Bestwert-Copy bleibt ein späterer Feinschliff.
- Tageskniffe-Abschluss ist als eigener Reward-Moment vorhanden: 3/3 geschafft, Streak und Text-Share.
- Home stärker kuratieren: Tageskniffe als Primärweg, restliche Spiele als Nebenangebot.
- Share Loop ist als native Text-Zusammenfassung pro Runde und Tageskniffe vorhanden. Bild-/Grid-Share erst nach Beta-Signal bauen.
- Doppel erst wieder sichtbar machen, wenn genug kuratierte Rätsel und Testerfeedback vorhanden sind.

## Animationen

Mehr Animation ist nicht automatisch besser. Die App hat bereits Tile-Flips, Shake-Feedback, Entry-Animationen und bewegte Boards. Was fehlt, ist Reward-Motion an wenigen Stellen:

- Sieg: kurzer Tile-Pop oder Board-Glow.
- Tagesabschluss: sichtbare Streak-/Completion-Animation.
- Hint verdient: kleine positive Rückmeldung.
- Rekord geknackt: kurzer Highlight-Moment.

Kein neues Animationspaket nötig. Reanimated reicht.

## Tester Insights

Für Beta und Soft Launch sollten diese Fragen messbar sein:

- Welches Game wird geöffnet, aber schnell verlassen?
- Wo öffnen Nutzer Hilfe?
- Welche Modi erzeugen viele ungültige Eingaben?
- Welche Modi werden gewonnen, verloren oder aufgedeckt?
- Wie oft schaffen Nutzer Tageskniffe 3/3?
- Welche Spiele fühlen sich zu leicht oder zu schwer an?
- Kommen Nutzer am nächsten Tag zurück?

## Priorität

1. Beta-Daten aus Result-Views, Feedback und Shares auswerten.
2. Doppel versteckt lassen, Code behalten.
3. Wort-/Puzzlequalität weiter kuratieren.
4. Rekord- und Bestwert-Momente verbessern.
5. Bild-/Grid-Share nur bauen, wenn Text-Share nicht reicht.
