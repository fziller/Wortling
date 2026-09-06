type TileMark = "absent" | "present" | "correct";

const markEmoji: Record<TileMark, string> = {
  absent: "⬜",
  present: "🟨",
  correct: "🟩",
};

export function buildMarkedGridShareText(title: string, dateKey: string, status: string, rows: readonly (readonly TileMark[])[], attemptLabel = "Versuche"): string {
  const result = status === "won" ? "Gelöst" : status === "lost" ? "Nicht gelöst" : "Aufgedeckt";
  const grid = rows.map((row) => row.map((mark) => markEmoji[mark]).join("")).join("\n");

  return [`Wortkniff ${title} ${dateKey}`, `${result} · ${rows.length} ${attemptLabel}`, grid].filter(Boolean).join("\n");
}

export function buildSimpleShareText(title: string, dateKey: string, status: string, detail: string): string {
  const result = status === "won" ? "Gelöst" : status === "lost" ? "Nicht gelöst" : "Aufgedeckt";

  return `Wortkniff ${title} ${dateKey}\n${result} · ${detail}`;
}

export function buildDailyKniffeShareText(dateKey: string, total: number, streak: number): string {
  return `Wortkniff Tageskniffe ${dateKey}\n${total}/${total} geschafft · Serie ${streak || 1}\n${"🟩".repeat(total)}`;
}
