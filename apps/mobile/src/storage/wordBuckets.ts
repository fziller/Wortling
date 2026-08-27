import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "wortkniff:settings:wordBuckets";

export type WordBucketPreset = "klassisch" | "erweitert" | "hart";

export type WordBucketSettings = {
  erweitert: boolean;
  hart: boolean;
};

const DEFAULTS: WordBucketSettings = {
  erweitert: false,
  hart: false,
};

export function getPreset(settings: WordBucketSettings): WordBucketPreset {
  if (settings.hart) return "hart";
  if (settings.erweitert) return "erweitert";
  return "klassisch";
}

export function getBucketBooleans(preset: WordBucketPreset): WordBucketSettings {
  if (preset === "hart") return { erweitert: true, hart: true };
  if (preset === "erweitert") return { erweitert: true, hart: false };
  return { erweitert: false, hart: false };
}

export async function loadWordBucketSettings(): Promise<WordBucketSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export async function saveWordBucketSettings(settings: WordBucketSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Settings are nice-to-have; gameplay should not crash if storage is unavailable.
  }
}
