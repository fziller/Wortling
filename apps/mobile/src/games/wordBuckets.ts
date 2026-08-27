import { generatedErweitertWords as betweenErweitert } from "./between/generated/erweitertWords";
import { generatedHartWords as betweenHart } from "./between/generated/hartWords";
import { generatedTargetWords as betweenClassic } from "./between/generated/targetWords";

import { generatedErweitertWords as wortleiterErweitert } from "./wortleiter/generated/erweitertWords";
import { generatedHartWords as wortleiterHart } from "./wortleiter/generated/hartWords";
import { generatedTargetWords as wortleiterClassic } from "./wortleiter/generated/targetWords";

import { generatedErweitertWords as wortcodeErweitert } from "./wortcode/generated/erweitertWords";
import { generatedHartWords as wortcodeHart } from "./wortcode/generated/hartWords";
import { generatedTargetWords as wortcodeClassic } from "./wortcode/generated/targetWords";

import { generatedErweitertWords as sharedErweitert } from "./shared/generated/erweitertWords7";
import { generatedHartWords as sharedHart } from "./shared/generated/hartWords7";
import { generatedTargetWords as sharedClassic } from "./shared/generated/targetWords7";

import type { SupportedWordLength, WordsByLength } from "./wordLengths";

export type BucketPreset = "klassisch" | "erweitert" | "hart";

export const BUCKET_PRESET_DESCRIPTIONS: Record<BucketPreset, string> = {
  klassisch: "Grundformen, bekannt & fair. Verben nur Infinitiv (sagen), Nomen nur Singular.",
  erweitert: "Plus Plurale (hunde) & konjugierte Verben (sagte, läuft).",
  hart: "Plus Partizipien (gesagt), Konjunktiv (sähe) & deklinierte Formen (kleine, bessere).",
};

export function getTargetsForPreset(length: SupportedWordLength, preset: BucketPreset): readonly string[] {
  if (length === 4) {
    if (preset === "hart") return hartFor(wortleiterClassic, wortleiterErweitert, wortleiterHart);
    if (preset === "erweitert") return erweitertFor(wortleiterClassic, wortleiterErweitert);
    return wortleiterClassic as unknown as string[];
  }
  if (length === 5) {
    if (preset === "hart") return hartFor(betweenClassic, betweenErweitert, betweenHart);
    if (preset === "erweitert") return erweitertFor(betweenClassic, betweenErweitert);
    return betweenClassic;
  }
  if (length === 6) {
    if (preset === "hart") return hartFor(wortcodeClassic, wortcodeErweitert, wortcodeHart);
    if (preset === "erweitert") return erweitertFor(wortcodeClassic, wortcodeErweitert);
    return wortcodeClassic as unknown as string[];
  }
  if (length === 7) {
    if (preset === "hart") return hartFor(sharedClassic, sharedErweitert, sharedHart);
    if (preset === "erweitert") return erweitertFor(sharedClassic, sharedErweitert);
    return sharedClassic as unknown as string[];
  }
  return [];
}

function erweitertFor(classic: readonly string[] | string[], erweitert: readonly string[]): readonly string[] {
  // erweitertWords already includes classic (base+plural+verb-finite), so return it
  return erweitert as unknown as string[];
}

function hartFor(classic: readonly string[] | string[], erweitert: readonly string[], hart: readonly string[]): readonly string[] {
  return hart as unknown as string[];
}

export function getWordsByLengthForPreset(preset: BucketPreset): WordsByLength {
  return {
    4: [...getTargetsForPreset(4, preset)],
    5: [...getTargetsForPreset(5, preset)],
    6: [...getTargetsForPreset(6, preset)],
    7: [...getTargetsForPreset(7, preset)],
  };
}
