import { tokens } from "@/design/tokens";

export const homeOrder = [
  "worttreffer",
  "wortschmelze",
  "galgenwort",
  "between",
  "wortcode",
  "formwort",
  "wortleiter",
  "doppel",
] as const;

export const previewWords = {
  wortcode: ["S", "P", "I", "E", "L"],
  galgenwort: ["K", "", "", "F", "F"],
  wortleiterTop: ["M", "A", "U", "S"],
  wortleiterBottom: ["H", "A", "U", "S"],
  wortschmelzeTop: ["W", "A", "L", "Z", "E"],
  wortschmelzeBottom: ["Z", "E", "B", "R", "A"],
} as const;

export const gameMeta = {
  wortcode: {
    color: "#2E7D32",
    dot: tokens.color.success,
    description: "Knacke das Wort mit Zahlenhinweisen.",
    rotate: "1deg",
    tape: "topRight",
  },
  galgenwort: {
    color: "#FBC02D",
    dot: "#FBC02D",
    description: "Errate die Buchstaben.",
    rotate: "-1deg",
    tape: "topLeft",
  },
  worttreffer: {
    color: tokens.color.primaryDark,
    dot: tokens.color.primary,
    description: "Errate das Wort in sechs Versuchen.",
    rotate: "1deg",
    tape: "bottomRight",
  },
  wortschmelze: {
    color: "#8E5A2A",
    dot: "#8E5A2A",
    description: "Zwei Wörter, eine Schmelze.",
    rotate: "-1deg",
    tape: "topCenter",
  },
  between: {
    color: tokens.color.secondary,
    dot: tokens.color.secondary,
    description: "Grenze das Zielwort alphabetisch ein.",
    rotate: "-1deg",
    tape: "topCenter",
  },
  doppel: {
    color: "#7B1FA2",
    dot: "#7B1FA2",
    description: "Zwei Wörter, ein Sinn.",
    rotate: "1deg",
    tape: "bottomLeft",
  },
  formwort: {
    color: "#C2185B",
    dot: "#C2185B",
    description: "Nutze Formen und Farbhinweise.",
    rotate: "-1deg",
    tape: "topRight",
  },
  wortleiter: {
    color: "#00796B",
    dot: "#00796B",
    description: "Schritt für Schritt.",
    rotate: "1deg",
    tape: "bottomCenter",
  },
} as const;

export type HomeGameId = keyof typeof gameMeta;
