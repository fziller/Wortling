import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { getBerlinDateKey } from "@/daily/date";
import { generateDailyKniffe, getDailyKniffeSummary } from "@/dailyKniffe";
import { games } from "@/games/registry";
import { loadProgressForGames } from "@/storage/progress";
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
    content: await createReminderContent(),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: settings.hour,
      minute: settings.minute,
    },
  });
}

export async function presentDevNotification(kind: "daily" | "unfinished"): Promise<void> {
  if (!__DEV__) return;

  await Notifications.scheduleNotificationAsync({
    content: kind === "unfinished"
      ? notificationContent("Noch Tageskniffe offen", "Du hast heute noch offene Rätsel. Kurz fertig machen?")
      : await createReminderContent(),
    trigger: null,
  });
}

export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_IDENTIFIER).catch(() => {});
}

async function createReminderContent(): Promise<Notifications.NotificationContentInput> {
  const dateKey = getBerlinDateKey();
  const dailyKniffe = generateDailyKniffe({ dateKey, games });
  const progress = await loadProgressForGames(dailyKniffe.map((kniff) => kniff.gameId), dateKey).catch(() => ({}));
  const summary = getDailyKniffeSummary(dailyKniffe, progress);
  const open = Math.max(0, summary.total - summary.completed);

  return notificationContent(
    open === summary.total || open === 0 ? "Deine Tageskniffe warten" : `Noch ${open} Tageskniff${open === 1 ? "" : "e"} offen`,
    open === summary.total || open === 0 ? "3 kurze Rätsel für heute." : "Kurz weiterspielen und die Serie sichern.",
  );
}

function notificationContent(title: string, body: string): Notifications.NotificationContentInput {
  return {
    title,
    body,
    sound: true,
    ...(Platform.OS === "android" ? { channelId: "daily-reminder" } : {}),
  };
}
