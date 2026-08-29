// @ts-ignore - node types not in mobile tsconfig, but available at runtime for tests
import { readFileSync } from "node:fs";
// @ts-ignore
import path from "node:path";
// @ts-ignore
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { getWordTileLayout } from "@/games/wordTileLayout";

// @ts-ignore
const dirname = path.dirname(fileURLToPath(import.meta.url));

describe("LetterInputTiles layout regression", () => {
  it("tile layout returns sensible sizes for 4 letters", () => {
    const layout = getWordTileLayout(4);
    expect(layout.minHeight).toBeGreaterThanOrEqual(46);
    expect(layout.gap).toBeGreaterThanOrEqual(4);
    expect(layout.fontSize).toBeGreaterThanOrEqual(20);
  });

  it("LetterInputTiles row stretches to full width (prevents squeezed input)", () => {
    const src = readFileSync(path.resolve(dirname, "LetterInputTiles.tsx"), "utf8");
    // row must have width 100% so flex:1 tiles actually fill the container
    expect(src).toMatch(/row:\s*\{\s*flexDirection:\s*"row",\s*width:\s*"100%"/s);
  });

  it("Wortleiter screen layout does not squeeze input (stretch + flex)", () => {
    const src = readFileSync(path.resolve(dirname, "../../app/games/wortleiter.tsx"), "utf8");
    // boardPanel must be flex:1 with minHeight:0, ladderScroll flex:1, content stretch
    expect(src).toMatch(/boardPanel:\s*\{\s*flex:\s*1,\s*minHeight:\s*0/s);
    expect(src).toMatch(/ladderScroll:\s*\{\s*flex:\s*1,\s*minHeight:\s*0\s*\}/);
    expect(src).toMatch(/ladderScrollContent:\s*\{\s*alignItems:\s*"stretch"/s);
    expect(src).toMatch(/inputStep:\s*\{\s*width:\s*"100%",\s*alignItems:\s*"stretch"/s);
  });
});
