import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "wortkniff:settings:notifications";

export type NotificationSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
};

const DEFAULTS: NotificationSettings = {
  enabled: false,
  hour: 18,
  minute: 0,
};

export async function loadNotificationSettings(): Promise<NotificationSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Settings are nice-to-have; gameplay should not crash if storage is unavailable.
  }
}
