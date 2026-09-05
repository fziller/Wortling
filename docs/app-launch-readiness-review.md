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
- Event Tracking war uneinheitlich. Ohne sauberen Funnel werden Beta-Probleme schwer zu finden.
- Doppel hat zu wenig Content-Tiefe für sichtbaren Launch-Pool und wird deshalb vorerst versteckt.

## Vor Live Nachziehen

- Einheitliches Event Tracking für jeden Screen und jedes Game: Start, Ende, Erfolg, Fail, Abbruch, Hilfe, Hinweis, Lösung anzeigen.
- Minimaler Tester-Feedback-Prompt nach Ergebnissen: `zu leicht`, `passt`, `zu schwer`.
- Ergebnis-Momente aufwerten: Rekord, besser als Durchschnitt, optimale Lösung, Hint verdient, Tageskniff-Fortschritt.
- Tageskniffe-Abschluss als eigener Reward-Moment: 3/3 geschafft, Streak, morgen wiederkommen.
- Home stärker kuratieren: Tageskniffe als Primärweg, restliche Spiele als Nebenangebot.
- Share Card ergänzen: einfache Text/Grid-Zusammenfassung pro Runde und Tageskniffe.
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

1. Event Tracking schließen.
2. Doppel verstecken, Code behalten.
3. Kleine Reward-Momente verbessern.
4. Testerfeedback minimal einbauen.
5. Share/Tagesabschluss polishen.
