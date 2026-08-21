import type { GameDefinition } from "./types";

export const games = [
  {
    id: "between",
    title: "Dazwischen",
    shortDescription: "Grenze ein deutsches Wort alphabetisch ein.",
    route: "/games/between",
    estimatedMinutes: 3,
    badge: "5 Buchstaben"
  },
  {
    id: "doppel",
    title: "Doppel",
    shortDescription: "Finde das Wort, das zwei Komposita verbindet.",
    route: "/games/doppel",
    estimatedMinutes: 2,
    badge: "Komposita"
  },
  {
    id: "worttreffer",
    title: "Worttreffer",
    shortDescription: "Errate ein Wort mit grün-gelb-grauem Feedback.",
    route: "/games/worttreffer",
    estimatedMinutes: 3,
    badge: "5 Buchstaben"
  },
  {
    id: "wortcode",
    title: "Wortcode",
    shortDescription: "Knacke ein Wort mit Mastermind-Logik.",
    route: "/games/wortcode",
    estimatedMinutes: 3,
    badge: "6 Buchstaben"
  }
] as const satisfies readonly GameDefinition[];

export const gameRegistry = Object.fromEntries(games.map((game) => [game.id, game]));
