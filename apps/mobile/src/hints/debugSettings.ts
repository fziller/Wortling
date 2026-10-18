import AsyncStorage from "@react-native-async-storage/async-storage";

import { isDebugBuild } from "@/config/runtime";
import { HINT_REGENERATION_MS } from "./types";

const STORAGE_KEY = "wortkniff:debug:hint-regeneration-ms:v1";
export const DEBUG_HINT_INTERVALS = [60_000, 5 * 60_000, HINT_REGENERATION_MS] as const;

export async function loadDebugHintRegenerationMs(): Promise<number> {
  if (!isDebugBuild) return HINT_REGENERATION_MS;
  const value = Number(await AsyncStorage.getItem(STORAGE_KEY));
  return DEBUG_HINT_INTERVALS.includes(value as (typeof DEBUG_HINT_INTERVALS)[number]) ? value : HINT_REGENERATION_MS;
}

export async function saveDebugHintRegenerationMs(value: number): Promise<void> {
  if (!isDebugBuild || !DEBUG_HINT_INTERVALS.includes(value as (typeof DEBUG_HINT_INTERVALS)[number])) return;
  await AsyncStorage.setItem(STORAGE_KEY, String(value));
}
