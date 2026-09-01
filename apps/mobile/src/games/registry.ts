import type { GameDefinition } from "./types";

export const games = [
  {
    id: "between",
    title: "Dazwischen",
    shortDescription: "Grenze ein deutsches Wort alphabetisch ein.",
    route: "/games/between",
    estimatedMinutes: 3,
    badge: "5 Buchstaben",
    dailyKniffEligible: true
  },
  {
    id: "doppel",
    title: "Doppel",
    shortDescription: "Finde das Wort, das zwei Komposita verbindet.",
    route: "/games/doppel",
    estimatedMinutes: 2,
    badge: "Komposita",
    dailyKniffEligible: true
  },
  {
    id: "galgenwort",
    title: "Galgenwort",
    shortDescription: "Errate ein deutsches Wort, bevor die Fehler ausgehen.",
    route: "/games/galgenwort",
    estimatedMinutes: 2,
    badge: "Buchstaben",
    dailyKniffEligible: true
  },
  {
    id: "formwort",
    title: "Formwort",
    shortDescription: "Nutze Formen und Farbhinweise, um das Wort zu knacken.",
    route: "/games/formwort",
    estimatedMinutes: 3,
    badge: "Formen",
    dailyKniffEligible: true
  },
  {
    id: "worttreffer",
    title: "Worttreffer",
    shortDescription: "Errate ein Wort mit grün-gelb-grauem Feedback.",
    route: "/games/worttreffer",
    estimatedMinutes: 3,
    badge: "4-7 Buchstaben",
    dailyKniffEligible: true
  },
  {
    id: "wortschmelze",
    title: "Wortschmelze",
    shortDescription: "Errate zwei überlappende Wörter als eine Schmelze.",
    route: "/games/wortschmelze",
    estimatedMinutes: 3,
    badge: "5+5 Wörter",
    dailyKniffEligible: true
  },
  {
    id: "wortleiter",
    title: "Wortleiter",
    shortDescription: "Verwandle ein Wort Schritt für Schritt ins Zielwort.",
    route: "/games/wortleiter",
    estimatedMinutes: 4,
    badge: "4 Buchstaben",
    dailyKniffEligible: true
  },
  {
    id: "wortcode",
    title: "Wortcode",
    shortDescription: "Knacke ein Wort mit Mastermind-Logik.",
    route: "/games/wortcode",
    estimatedMinutes: 3,
    badge: "5-7 Buchstaben",
    dailyKniffEligible: true
  }
] as const satisfies readonly GameDefinition[];

export const gameRegistry = Object.fromEntries(games.map((game) => [game.id, game]));
