import { DoppelPuzzle } from "./types";

export const DOPPEL_CONTENT_VERSION = 1;

export const doppelPuzzles: DoppelPuzzle[] = [
  puzzle("doppel-001", "Kinder", "Platz", "Spiel", "Kinderspiel", "Spielplatz", "Etwas, das Kinder häufig tun."),
  puzzle("doppel-002", "Wasser", "Schirm", "Fall", "Wasserfall", "Fallschirm", "Es geht nach unten."),
  puzzle("doppel-003", "Sonnen", "Topf", "Blume", "Sonnenblume", "Blumentopf", "Wächst oft draußen."),
  puzzle("doppel-004", "Haus", "Griff", "Tür", "Haustür", "Türgriff", "Damit kommt man hinein."),
  puzzle("doppel-005", "Auto", "Hof", "Bahn", "Autobahn", "Bahnhof", "Dort bewegt sich Verkehr."),
  puzzle("doppel-006", "Garten", "Tür", "Haus", "Gartenhaus", "Haustür", "Ein Gebäude."),
  puzzle("doppel-007", "Reise", "Bild", "Pass", "Reisepass", "Passbild", "Braucht man manchmal unterwegs."),
  puzzle("doppel-008", "Hand", "Fach", "Schuh", "Handschuh", "Schuhfach", "Trägt man am Körper."),
  puzzle("doppel-009", "Buch", "Kasse", "Laden", "Buchladen", "Ladenkasse", "Dort kauft man etwas."),
  puzzle("doppel-010", "Milch", "Arzt", "Zahn", "Milchzahn", "Zahnarzt", "Im Mund zu finden."),
  puzzle("doppel-011", "Zahn", "Kopf", "Bürste", "Zahnbürste", "Bürstenkopf", "Hilft beim Saubermachen."),
  puzzle("doppel-012", "Apfel", "Haus", "Baum", "Apfelbaum", "Baumhaus", "Steht draußen."),
  puzzle("doppel-013", "Winter", "Knopf", "Mantel", "Wintermantel", "Mantelknopf", "Trägt man, wenn es kalt ist."),
  puzzle("doppel-014", "Stadt", "Platz", "Park", "Stadtpark", "Parkplatz", "Dort hält man sich auf."),
  puzzle("doppel-015", "Licht", "Dose", "Schalter", "Lichtschalter", "Schalterdose", "Damit ändert man etwas."),
  puzzle("doppel-016", "Schnee", "Spiel", "Ball", "Schneeball", "Ballspiel", "Kann man werfen."),
  puzzle("doppel-017", "Brot", "Plan", "Zeit", "Brotzeit", "Zeitplan", "Hat mit Tagesablauf zu tun."),
  puzzle("doppel-018", "Bier", "Rand", "Glas", "Bierglas", "Glasrand", "Daraus kann man trinken."),
  puzzle("doppel-019", "Kaffee", "Kuchen", "Tasse", "Kaffeetasse", "Tassenkuchen", "Steht oft auf dem Tisch."),
  puzzle("doppel-020", "Kopf", "Kabel", "Hörer", "Kopfhörer", "Hörerkabel", "Hat mit Zuhören zu tun.")
];

function puzzle(id: string, leftWord: string, rightWord: string, answer: string, leftCompound: string, rightCompound: string, definition: string): DoppelPuzzle {
  return {
    id,
    version: DOPPEL_CONTENT_VERSION,
    leftWord,
    rightWord,
    difficulty: "easy",
    solutions: [{ answer, leftCompound, rightCompound }],
    hints: [
      { type: "length", value: Array.from(answer).length },
      { type: "first_letter", value: answer[0] },
      { type: "definition", value: definition }
    ],
    explanation: `${leftCompound} und ${rightCompound}.`
  };
}
