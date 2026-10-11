// @ts-ignore - node types are intentionally not part of the mobile tsconfig.
import { readFileSync } from "node:fs";
// @ts-ignore
import { execFileSync } from "node:child_process";
// @ts-ignore
import path from "node:path";
// @ts-ignore
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { materializeSilbenmixPuzzle, silbenmixPuzzleCandidates } from "./content";

// @ts-ignore
const dirname = path.dirname(fileURLToPath(import.meta.url));

describe("Silbenmix generated content", () => {
  it("provides fair candidates for every difficulty with stable unique tile IDs", () => {
    for (const difficulty of ["easy", "medium", "hard"] as const) {
      expect(silbenmixPuzzleCandidates.filter((puzzle) => puzzle.difficulty === difficulty).length).toBeGreaterThanOrEqual(40);
    }
    const sample = silbenmixPuzzleCandidates.slice(0, 30).map((candidate) => materializeSilbenmixPuzzle(candidate));
    expect(sample.every((puzzle) => new Set(puzzle.tiles.map((tile) => tile.id)).size === puzzle.tiles.length)).toBe(true);
    expect(sample.every((puzzle) => puzzle.tiles.length === puzzle.syllableCount)).toBe(true);
  });

  it("uses the vendored German reformed-orthography patterns", () => {
    const source = readFileSync(path.resolve(dirname, "../../../scripts/data/hyph-de-1996.pat.txt"), "utf8");
    expect(source).toContain(".ab3a");
    expect(readFileSync(path.resolve(dirname, "../../../scripts/data/hyph-de-1996.LICENSE.md"), "utf8")).toContain("MIT License");
  });

  it("splits common German words including umlauts with the vendored rules", () => {
    const output = execFileSync("node", ["--input-type=module", "-e", `
      import { readFile } from "node:fs/promises";
      import { createGermanHyphenator } from "./scripts/silbenmix-hyphenation.mjs";
      const hyphenate = createGermanHyphenator(await readFile("./scripts/data/hyph-de-1996.pat.txt", "utf8"));
      console.log(JSON.stringify(["zitrone", "banane", "tomate", "äpfel", "häuser"].map((word) => hyphenate(word))));
    `], { cwd: path.resolve(dirname, "../../.."), encoding: "utf8" });
    expect(JSON.parse(output)).toEqual([["zi", "tro", "ne"], ["ba", "na", "ne"], ["to", "ma", "te"], ["äp", "fel"], ["häu", "ser"]]);
  });
});
