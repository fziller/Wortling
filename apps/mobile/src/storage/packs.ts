import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PackFrequency, PackId } from "@/games/wordConfig";

const STORAGE_KEY = "wortkniff:settings:packs";

export type PackSettings = {
  enabled: boolean;
  frequency: PackFrequency;
};

export type PacksSettings = Record<PackId, PackSettings>;

const DEFAULTS: PacksSettings = {
  bio: { enabled: false, frequency: "normal" },
};

export function getDefaultPacksSettings(): PacksSettings {
  return { ...DEFAULTS, bio: { ...DEFAULTS.bio } };
}

export async function loadPacksSettings(): Promise<PacksSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultPacksSettings();
    const parsed = JSON.parse(raw) as Partial<PacksSettings>;
    return { ...getDefaultPacksSettings(), ...parsed, bio: { ...DEFAULTS.bio, ...(parsed.bio ?? {}) } };
  } catch {
    return getDefaultPacksSettings();
  }
}

export async function savePacksSettings(settings: PacksSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // nice-to-have
  }
}

export function isPackEnabled(settings: PacksSettings, packId: PackId): boolean {
  return !!settings[packId]?.enabled;
}

export function getPackFrequency(settings: PacksSettings, packId: PackId): PackFrequency {
  return settings[packId]?.frequency ?? "normal";
}
