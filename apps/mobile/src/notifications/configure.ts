import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export function configureNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("daily-reminder", {
      name: "Tägliche Rätsel-Erinnerung",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}
