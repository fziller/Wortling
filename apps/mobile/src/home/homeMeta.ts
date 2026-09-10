import { tokens } from "@/design/tokens";

export const homeOrder = [
  "worttreffer",
  "wortschmelze",
  "galgenwort",
  "between",
  "wortcode",
  "formwort",
  "wortleiter",
] as const;

export const previewWords = {
  worttreffer: ["S", "P", "", "E", "L"],
  wortcode: ["S", "P", "I", "E", "L"],
  galgenwort: ["K", "", "", "F", "F"],
  wortleiterTop: ["M", "A", "U", "S"],
  wortleiterBottom: ["H", "A", "U", "S"],
  wortschmelzeTop: ["W", "A", "L", "Z", "E"],
  wortschmelzeBottom: ["Z", "E", "B", "R", "A"],
} as const;

export const gameMeta = {
  wortcode: {
    color: tokens.gameAccent.wortcode,
    dot: tokens.gameAccent.wortcode,
    description: "Knacke das Wort mit Zahlenhinweisen.",
    rotate: "1deg",
    tape: "topRight",
  },
  galgenwort: {
    color: tokens.gameAccent.galgenwort,
    dot: tokens.gameAccent.galgenwort,
    description: "Errate die Buchstaben.",
    rotate: "-1deg",
    tape: "topLeft",
  },
  worttreffer: {
    color: tokens.gameAccent.worttreffer,
    dot: tokens.semantic.brandAccent,
    description: "Errate das Wort in sechs Versuchen.",
    rotate: "1deg",
    tape: "bottomRight",
  },
  wortschmelze: {
    color: tokens.gameAccent.wortschmelze,
    dot: tokens.gameAccent.wortschmelze,
    description: "Zwei Wörter, eine Schmelze.",
    rotate: "-1deg",
    tape: "topCenter",
  },
  between: {
    color: tokens.gameAccent.between,
    dot: tokens.gameAccent.between,
    description: "Grenze das Zielwort alphabetisch ein.",
    rotate: "-1deg",
    tape: "topCenter",
  },
  doppel: {
    color: tokens.gameAccent.doppel,
    dot: tokens.gameAccent.doppel,
    description: "Zwei Wörter, ein Sinn.",
    rotate: "1deg",
    tape: "bottomLeft",
  },
  formwort: {
    color: tokens.gameAccent.formwort,
    dot: tokens.gameAccent.formwort,
    description: "Nutze Formen und Farbhinweise.",
    rotate: "-1deg",
    tape: "topRight",
  },
  wortleiter: {
    color: tokens.gameAccent.wortleiter,
    dot: tokens.gameAccent.wortleiter,
    description: "Schritt für Schritt.",
    rotate: "1deg",
    tape: "bottomCenter",
  },
} as const;

export type HomeGameId = keyof typeof gameMeta;
