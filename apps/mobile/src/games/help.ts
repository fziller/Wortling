export const gameHelp = {
  between: {
    title: "So geht Dazwischen",
    paragraphs: [
      "Finde das Zielwort im Alphabet.",
      "Jeder Tipp sagt dir, ob das Zielwort alphabetisch davor oder danach liegt.",
      "Der offene Bereich wird kleiner, bis du das Wort triffst."
    ]
  },
  doppel: {
    title: "So geht Doppel",
    paragraphs: [
      "Finde ein Wort, das mit beiden Seiten ein deutsches Wort bildet.",
      "Beispiel: KINDER + SPIEL + PLATZ ergibt Kinderspiel und Spielplatz.",
      "Hinweise helfen dir Schritt für Schritt. Wenn du die Lösung zeigst, zählt das Rätsel nicht als geschafft."
    ]
  },
  galgenwort: {
    title: "So geht Galgenwort",
    paragraphs: [
      "Errate das gesuchte Wort Buchstabe für Buchstabe.",
      "Richtige Buchstaben werden überall im Wort aufgedeckt.",
      "Falsche Buchstaben zählen als Fehler. Sind alle Fehler aufgebraucht, ist die Runde verloren."
    ]
  },
  formwort: {
    title: "So geht Formwort",
    paragraphs: [
      "Errate das Wort in sechs Versuchen.",
      "Oben siehst du Formen für die Buchstaben des Lösungsworts. Gleiche Formen bedeuten gleiche Buchstaben.",
      "Nach jedem Tipp zeigt Grün die richtige Stelle, Gelb einen enthaltenen Buchstaben und Grau einen falschen Buchstaben."
    ]
  },
  worttreffer: {
    title: "So geht Worttreffer",
    paragraphs: [
      "Errate das gesuchte Wort in sechs Versuchen.",
      "Grün heißt: Buchstabe richtig und an der richtigen Stelle.",
      "Gelb heißt: Buchstabe kommt vor, aber an einer anderen Stelle.",
      "Grau heißt: Der Buchstabe kommt nicht im Wort vor. Die Tastatur merkt sich diese Hinweise."
    ]
  },
  wortschmelze: {
    title: "So geht Wortschmelze",
    paragraphs: [
      "Errate die Schmelze aus zwei Wörtern in sechs Versuchen.",
      "Beide Wörter haben fünf Buchstaben. Die letzten zwei Buchstaben des ersten Wortes sind die ersten zwei Buchstaben des zweiten Wortes.",
      "Beispiel: WALZE + ZEBRA wird zu WALZEBRA. Grün, Gelb und Grau funktionieren wie bei Worttreffer."
    ]
  },
  wortleiter: {
    title: "So geht Wortleiter",
    paragraphs: [
      "Verwandle das Startwort in das Zielwort.",
      "Jeder Schritt muss ein gültiges deutsches Wort sein und genau einen Buchstaben ändern.",
      "Du darfst Wörter in derselben Leiter nicht wiederholen. Mit Zurück nimmst du den letzten Schritt raus."
    ]
  },
  wortcode: {
    title: "So geht Wortcode",
    paragraphs: [
      "Knacke das gesuchte Wort.",
      "Neben jedem Tipp zeigen drei Kästchen: Grün = exakt richtig, Gelb = im Wort enthalten, Rot = nicht im Wort. Die Zahlen sagen dir wie viele.",
      "Du siehst nicht, welche Positionen richtig sind.",
      "Tippe auf Buchstaben in alten Versuchen um sie zu markieren: Gelb vielleicht enthalten, Grün vielleicht exakt, Rot sicher falsch. Deine Notizen werden passend auf gleiche Buchstaben übertragen."
    ]
  }
} as const;
