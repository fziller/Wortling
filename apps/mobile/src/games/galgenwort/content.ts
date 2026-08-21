import type { GalgenwortPuzzle } from "./types";

export const GALGENWORT_CONTENT_VERSION = 1;
export const GALGENWORT_MAX_WRONG_GUESSES = 8;

export const galgenwortPuzzles: GalgenwortPuzzle[] = [
  puzzle("galgenwort-001", "banane", "Obst"),
  puzzle("galgenwort-002", "fenster", "Zu Hause"),
  puzzle("galgenwort-003", "schlüssel", "Alltag"),
  puzzle("galgenwort-004", "regenbogen", "Wetter"),
  puzzle("galgenwort-005", "bibliothek", "Ort"),
  puzzle("galgenwort-006", "fahrrad", "Unterwegs"),
  puzzle("galgenwort-007", "sandburg", "Sommer"),
  puzzle("galgenwort-008", "kopfhörer", "Technik"),
  puzzle("galgenwort-009", "erdbeere", "Essen"),
  puzzle("galgenwort-010", "kaminfeuer", "Gemütlich"),
  puzzle("galgenwort-011", "zeitung", "Lesen"),
  puzzle("galgenwort-012", "rucksack", "Unterwegs"),
  puzzle("galgenwort-013", "schnecke", "Tier"),
  puzzle("galgenwort-014", "laterne", "Draußen"),
  puzzle("galgenwort-015", "pflaster", "Hilfe"),
  puzzle("galgenwort-016", "honigglas", "Frühstück"),
  puzzle("galgenwort-017", "wolldecke", "Zu Hause"),
  puzzle("galgenwort-018", "streichholz", "Feuer"),
  puzzle("galgenwort-019", "briefkasten", "Post"),
  puzzle("galgenwort-020", "spielplatz", "Draußen")
];

function puzzle(id: string, answer: string, clue: string): GalgenwortPuzzle {
  return { id, version: GALGENWORT_CONTENT_VERSION, answer, clue, maxWrongGuesses: GALGENWORT_MAX_WRONG_GUESSES };
}
