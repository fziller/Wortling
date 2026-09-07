import { describe, expect, it } from "vitest";

import { buildDailyKniffeShareText, buildMarkedGridShareText, buildSimpleShareText } from "./grid";

describe("share text", () => {
  it("builds spoiler-safe marked grids", () => {
    expect(buildMarkedGridShareText("Worttreffer", "2026-09-06", "won", [{ guess: "amp", marks: ["correct", "present", "absent"] }], "ampel")).toBe("Wortkniff Worttreffer 2026-09-06\nGelöst · 1 Versuche\nLösung: AMPEL\n1. AMP 🟩🟨⬜");
  });

  it("builds simple share text", () => {
    expect(buildSimpleShareText("Dazwischen", "2026-09-06", "revealed", "4 Versuche")).toBe("Wortkniff Dazwischen 2026-09-06\nAufgedeckt · 4 Versuche");
  });

  it("builds daily share text", () => {
    expect(buildDailyKniffeShareText("2026-09-06", 3, 2)).toContain("🟩🟩🟩");
  });
});
