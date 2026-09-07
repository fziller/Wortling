export const gameHelp = {
  between: {
    title: "So geht Dazwischen",
    paragraphs: [
      "Finde das Zielwort im Alphabet.",
      "Jeder Versuch sagt dir, ob das Zielwort alphabetisch davor oder danach liegt.",
      "Ein Hinweis zeigt einen Zielbuchstaben als Platzhalter, schränkt deine Eingabe aber nicht ein.",
      "Die Zahlen zeigen, wie viele Wörter zwischen den Grenzen und dem Zielwort stehen.",
      "Der Buchstabenstreifen zeigt für das aktuelle Eingabefeld, welche Buchstaben noch in den offenen Bereich passen."
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
      "Falsche Buchstaben zählen als Fehler. Sind alle Fehler aufgebraucht, ist die Runde verloren.",
      "Ein Hinweis deckt einen passenden Buchstaben auf."
    ]
  },
  formwort: {
    title: "So geht Formwort",
    paragraphs: [
      "Errate das Wort in sechs Versuchen.",
      "Oben siehst du Formen für die Buchstaben des Lösungsworts. Gleiche Formen bedeuten gleiche Buchstaben.",
      "Nach jedem Versuch zeigt Grün die richtige Stelle, Gelb einen enthaltenen Buchstaben und Grau einen falschen Buchstaben.",
      "Ein Hinweis zeigt einen Lösungsbuchstaben als Platzhalter, schränkt deine Eingabe aber nicht ein."
    ]
  },
  worttreffer: {
    title: "So geht Worttreffer",
    paragraphs: [
      "Errate das gesuchte Wort in sechs Versuchen.",
      "Grün heißt: Buchstabe richtig und an der richtigen Stelle.",
      "Gelb heißt: Buchstabe kommt vor, aber an einer anderen Stelle.",
      "Grau heißt: Der Buchstabe kommt nicht im Wort vor. Die Tastatur merkt sich diese Hinweise.",
      "Ein Hinweis zeigt einen Lösungsbuchstaben als Platzhalter, schränkt deine Eingabe aber nicht ein."
    ]
  },
  wortschmelze: {
    title: "So geht Wortschmelze",
    paragraphs: [
      "Errate die Schmelze aus zwei Wörtern in sechs Versuchen.",
      "Beide Wörter haben fünf Buchstaben. Die letzten zwei Buchstaben des ersten Wortes sind die ersten zwei Buchstaben des zweiten Wortes.",
      "Beispiel: WALZE + ZEBRA wird zu WALZEBRA. Grün, Gelb und Grau funktionieren wie bei Worttreffer.",
      "Ein Hinweis zeigt einen Lösungsbuchstaben als Platzhalter, schränkt deine Eingabe aber nicht ein."
    ]
  },
  wortleiter: {
    title: "So geht Wortleiter",
    paragraphs: [
      "Verwandle das Startwort in das Zielwort.",
      "Jeder Schritt muss ein gültiges deutsches Wort sein und genau einen Buchstaben ändern.",
      "Du darfst Wörter in derselben Leiter nicht wiederholen. Mit Zurück nimmst du den letzten Schritt raus.",
      "Ein Hinweis ergänzt einen gültigen nächsten Schritt Richtung Ziel."
    ]
  },
  wortcode: {
    title: "So geht Wortcode",
    paragraphs: [
      "Knacke das gesuchte Wort.",
      "Neben jedem Versuch zeigen drei Kästchen: Grün = exakt richtig, Gelb = im Wort enthalten, Rot = nicht im Wort. Die Zahlen sagen dir wie viele.",
      "Du siehst nicht, welche Positionen richtig sind.",
      "Tippe auf Buchstaben in alten Versuchen um sie zu markieren: Gelb vielleicht enthalten, Grün vielleicht exakt, Rot sicher falsch. Deine Notizen werden passend auf gleiche Buchstaben übertragen.",
      "Ein Hinweis zeigt einen Lösungsbuchstaben als Platzhalter, schränkt deine Eingabe aber nicht ein."
    ]
  }
} as const;
