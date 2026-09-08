import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { getBerlinDateKey } from "@/daily/date";
import { generateDailyKniffe, getDailyKniffeSummary } from "@/dailyKniffe";
import { gameRegistry, games } from "@/games/registry";
import { loadProgressForGames } from "@/storage/progress";
import { loadNotificationSettings } from "@/storage/settings";

const DAILY_IDENTIFIER = "wortkniff-daily-reminder";
const UNFINISHED_IDENTIFIER = "wortkniff-unfinished-reminder";
const UNFINISHED_HOUR = 20;
const UNFINISHED_MINUTE = 30;
const SCHEDULE_DAYS = 7;

export async function scheduleDailyReminder(): Promise<void> {
  const settings = await loadNotificationSettings();

  if (!settings.enabled) {
    await cancelDailyReminder();
    return;
  }

  await cancelDailyReminder();

  const now = new Date();
  for (let dayOffset = 0; dayOffset < SCHEDULE_DAYS; dayOffset += 1) {
    const triggerDate = dateAtLocalTime(dayOffset, settings.hour, settings.minute);
    if (triggerDate <= now) continue;

    const reminder = await createReminderContent(getBerlinDateKey(triggerDate));
    await Notifications.scheduleNotificationAsync({
      identifier: `${DAILY_IDENTIFIER}:${getBerlinDateKey(triggerDate)}`,
      content: reminder.content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  }

  const reminder = await createReminderContent(getBerlinDateKey(now));

  const unfinishedDate = dateAtLocalTime(0, UNFINISHED_HOUR, UNFINISHED_MINUTE);
  if (reminder.open > 0 && reminder.completed > 0 && unfinishedDate > now) {
    if (settings.unfinishedEnabled === false) return;

    await Notifications.scheduleNotificationAsync({
      identifier: `${UNFINISHED_IDENTIFIER}:${getBerlinDateKey(now)}`,
      content: notificationContent(`Noch ${reminder.open} Tageskniff${reminder.open === 1 ? "" : "e"} offen`, "Kurz fertig machen und die Serie sichern.", "unfinished", reminder.nextUrl),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: unfinishedDate,
      },
    });
  }
}

export async function presentDevNotification(kind: "daily" | "unfinished"): Promise<void> {
  if (!__DEV__) return;

  await Notifications.scheduleNotificationAsync({
    content: kind === "unfinished"
      ? notificationContent("Noch Tageskniffe offen", "Du hast heute noch offene Rätsel. Kurz fertig machen?", "unfinished", "/")
      : (await createReminderContent(getBerlinDateKey())).content,
    trigger: null,
  });
}

export async function cancelDailyReminder(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  await Promise.all(scheduled
    .filter((notification) => notification.identifier.startsWith(DAILY_IDENTIFIER) || notification.identifier.startsWith(UNFINISHED_IDENTIFIER))
    .map((notification) => Notifications.cancelScheduledNotificationAsync(notification.identifier).catch(() => {})));
}

async function createReminderContent(dateKey: string): Promise<{ completed: number; content: Notifications.NotificationContentInput; nextUrl: string; open: number }> {
  const dailyKniffe = generateDailyKniffe({ dateKey, games });
  const progress = await loadProgressForGames(dailyKniffe.map((kniff) => kniff.gameId), dateKey).catch(() => ({} as Awaited<ReturnType<typeof loadProgressForGames>>));
  const summary = getDailyKniffeSummary(dailyKniffe, progress);
  const open = Math.max(0, summary.total - summary.completed);
  const next = dailyKniffe.find((kniff) => progress[kniff.gameId]?.completedStatus !== "won" && progress[kniff.gameId]?.status !== "won");
  const nextUrl = next ? gameRegistry[next.gameId]?.route ?? "/" : "/";

  return {
    completed: summary.completed,
    content: notificationContent(
    open === summary.total || open === 0 ? "Deine Tageskniffe warten" : `Noch ${open} Tageskniff${open === 1 ? "" : "e"} offen`,
    open === summary.total || open === 0 ? "3 kurze Rätsel für heute." : "Kurz weiterspielen und die Serie sichern.",
    "daily",
    nextUrl,
    ),
    nextUrl,
    open,
  };
}

function dateAtLocalTime(dayOffset: number, hour: number, minute: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function notificationContent(title: string, body: string, kind: "daily" | "unfinished", url: string): Notifications.NotificationContentInput {
  return {
    title,
    body,
    data: { kind, url },
    sound: true,
    ...(Platform.OS === "android" ? { channelId: "daily-reminder" } : {}),
  };
}
