import { generatedAnagrammSolutionsBySignature, generatedAnagrammTargetsByLength, generatedAnagrammTargetsByPreset } from "./generated/content";
import type { BucketPreset } from "../wordBuckets";
import type { AnagrammWordLength } from "./types";

export const ANAGRAMM_CONTENT_VERSION = 1;

export const anagrammTargetsByLength = generatedAnagrammTargetsByLength as unknown as Record<AnagrammWordLength, readonly string[]>;
export const anagrammTargetsByPreset = generatedAnagrammTargetsByPreset as unknown as Record<BucketPreset, Record<AnagrammWordLength, readonly string[]>>;
export const anagrammSolutionsBySignature = generatedAnagrammSolutionsBySignature as unknown as Record<AnagrammWordLength, Readonly<Record<string, readonly string[]>>>;
