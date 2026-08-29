import { describe, expect, it } from "vitest";

import { allowedGuesses, wortleiterPuzzles } from "./content";
import { generatedAllowedGuesses } from "./generated/allowedGuesses";
import { generatedWordMeta } from "./generated/wordMeta";

const BLOCKED_ABBREVIATIONS = [
  "abcs", "abms", "adac", "akws", "asvg", "bdsg", "bmws", "bshg", "btmg", "bvwg",
  "cpus", "crms", "cvjm", "daad", "ddos", "egmr", "ehec", "ehnl", "ekgs",
  "fckw", "fdgo", "fsme", "gmbh", "gpus", "hdmi", "http", "isbn", "isdn", "issn",
  "jvas", "kfzs", "ldpd", "lgbt", "lkws", "mbit", "mpox", "mrna", "mvas", "nvas",
  "oecd", "oems", "öpnv", "pdfs", "pkws", "pvcs", "rfid", "scsi", "stpo", "stvo",
];

describe("wortleiter abbreviations filter", () => {
  it("contains no blocked abbreviations in allowedGuesses", () => {
    const allowed = new Set(allowedGuesses);
    const leaked = BLOCKED_ABBREVIATIONS.filter((w) => allowed.has(w));
    expect(leaked).toEqual([]);
  });

  it("contains no blocked abbreviations in generated wordMeta", () => {
    const metaWords = new Set(generatedWordMeta.map((m) => (m as { word: string }).word));
    const leaked = BLOCKED_ABBREVIATIONS.filter((w) => metaWords.has(w));
    expect(leaked).toEqual([]);
  });

  it("contains no blocked abbreviations in puzzles", () => {
    const leaked = wortleiterPuzzles.filter((p) =>
      [p.startWord, p.targetWord, ...p.solution].some((w) => BLOCKED_ABBREVIATIONS.includes(w))
    );
    expect(leaked).toEqual([]);
  });

  it("still contains valid German words (hash stays allowed)", () => {
    // hash is English loanword but NOT an abbreviation – must stay per product decision
    expect(generatedAllowedGuesses.includes("hash" as never)).toBe(true);
    expect(allowedGuesses.includes("hash")).toBe(true);
  });

  it("mbit is blocked but hash is not", () => {
    expect(allowedGuesses.includes("mbit")).toBe(false);
    expect(allowedGuesses.includes("hash")).toBe(true);
  });
});
