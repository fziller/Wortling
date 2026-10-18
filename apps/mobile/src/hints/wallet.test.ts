import { describe, expect, it } from "vitest";

import { HINT_REGENERATION_MS } from "./types";
import { consumeHint, fullHintsAt, nextHintInMs, regenerateHints } from "./wallet";

const start = 1_700_000_000_000;
const wallet = (balance: number, nextRegenerationAt: number | null) => ({ version: 2, balance, nextRegenerationAt, winsSinceLastHint: 0, totalEarned: 0, totalSpent: 0 });

describe("hint wallet regeneration", () => {
  it("regenerates one hint every 30 minutes and caps at three", () => {
    const initial = wallet(0, start + HINT_REGENERATION_MS);
    expect(regenerateHints(initial, start + HINT_REGENERATION_MS).balance).toBe(1);
    const full = regenerateHints(initial, start + 9 * HINT_REGENERATION_MS);
    expect(full.balance).toBe(3);
    expect(full.nextRegenerationAt).toBeNull();
  });

  it("starts regeneration when a full wallet is spent", () => {
    const spent = consumeHint(wallet(3, null), start);
    expect(spent.balance).toBe(2);
    expect(spent.nextRegenerationAt).toBe(start + HINT_REGENERATION_MS);
    expect(nextHintInMs(spent, start)).toBe(HINT_REGENERATION_MS);
  });

  it("schedules the full-wallet moment, not next single hint", () => {
    const partial = wallet(1, start + HINT_REGENERATION_MS);
    expect(fullHintsAt(partial, start)).toBe(start + 2 * HINT_REGENERATION_MS);
    expect(fullHintsAt(wallet(3, null), start)).toBeNull();
  });

  it("accepts a debug-only regeneration interval without changing the production default", () => {
    const interval = 60_000;
    const spent = consumeHint(wallet(3, null), start, interval);

    expect(spent.nextRegenerationAt).toBe(start + interval);
    expect(regenerateHints(spent, start + interval, interval).balance).toBe(3);
  });
});
