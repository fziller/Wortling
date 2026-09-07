export type ShareTileMark = "absent" | "present" | "correct";

export type ShareGuessRow = {
  guess: string;
  marks: readonly ShareTileMark[];
};

export const markEmoji: Record<ShareTileMark, string> = {
  absent: "⬜",
  present: "🟨",
  correct: "🟩",
};

export function buildMarkedGridShareText(title: string, dateKey: string, status: string, rows: readonly ShareGuessRow[], solution?: string, attemptLabel = "Versuche"): string {
  const result = status === "won" ? "Gelöst" : status === "lost" ? "Nicht gelöst" : "Aufgedeckt";
  const grid = rows.map((row, index) => `${index + 1}. ${row.guess.toLocaleUpperCase("de-DE")} ${row.marks.map((mark) => markEmoji[mark]).join("")}`).join("\n");

  return [`Wortkniff ${title} ${dateKey}`, `${result} · ${rows.length} ${attemptLabel}`, solution ? `Lösung: ${solution.toLocaleUpperCase("de-DE")}` : "", grid].filter(Boolean).join("\n");
}

export function buildSimpleShareText(title: string, dateKey: string, status: string, detail: string): string {
  const result = status === "won" ? "Gelöst" : status === "lost" ? "Nicht gelöst" : "Aufgedeckt";

  return `Wortkniff ${title} ${dateKey}\n${result} · ${detail}`;
}

export function buildDailyKniffeShareText(dateKey: string, total: number, streak: number): string {
  return `Wortkniff Tageskniffe ${dateKey}\n${total}/${total} geschafft · Serie ${streak || 1}\n${"🟩".repeat(total)}`;
}
