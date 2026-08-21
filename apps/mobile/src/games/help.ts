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
  wortcode: {
    title: "So geht Wortcode",
    paragraphs: [
      "Knacke das gesuchte Wort.",
      "Nach jedem Versuch siehst du nur, wie viele Buchstaben exakt richtig stehen und wie viele weitere enthalten sind.",
      "Du siehst nicht, welche Positionen richtig sind.",
      "Du kannst Buchstaben in alten Versuchen selbst markieren: Gelb heißt vielleicht enthalten, Grün heißt vielleicht exakt. Diese Farben sind nur deine Notizen."
    ]
  }
} as const;
