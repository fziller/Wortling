import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { loadNotificationSettings } from "@/storage/settings";

const DAILY_IDENTIFIER = "wortkniff-daily-reminder";

export async function scheduleDailyReminder(): Promise<void> {
  const settings = await loadNotificationSettings();

  if (!settings.enabled) {
    await cancelDailyReminder();
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(DAILY_IDENTIFIER).catch(() => {});

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_IDENTIFIER,
    content: {
      title: "🧠 Dein tägliches Wortspiel wartet!",
      body: "3 neue Rätsel warten auf dich.",
      sound: true,
      ...(Platform.OS === "android" ? { channelId: "daily-reminder" } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: settings.hour,
      minute: settings.minute,
    },
  });
}

export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_IDENTIFIER).catch(() => {});
}
