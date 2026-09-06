import "react-native-gesture-handler";

import { Stack } from "expo-router";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Sentry from "@sentry/react-native";
import { PostHogProvider, usePostHog } from "posthog-react-native";
import { useEffect, useState } from "react";

import { AppSplash } from "@/components/AppSplash";
import { getBerlinDateKey } from "@/daily/date";
import { initSentry } from "@/monitoring/sentry";
import { posthogConfig } from "@/analytics/posthog";
import { captureEvent } from "@/analytics/events";
import { configureNotifications } from "@/notifications/configure";
import { scheduleDailyReminder } from "@/notifications/scheduler";
import { closeAbandonedSessions } from "@/stats/repository";
import { initStats } from "@/stats/db";

initSentry();

function RootLayoutInner() {
  const router = useRouter();
  const posthog = usePostHog();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    try {
      configureNotifications();
    } catch {
      // Notifications are nice-to-have; startup must stay offline-safe.
    }

    scheduleDailyReminder().catch(() => {});

    initStats()
      .then(() => closeAbandonedSessions(getBerlinDateKey()))
      .catch(() => {
        // Stats are nice-to-have; startup must stay offline-safe.
      });
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data ?? {};
      const url = typeof data.url === "string" ? data.url : "/";
      const kind = data.kind === "daily" || data.kind === "unfinished" ? data.kind : "unknown";

      captureEvent(posthog, "notification_opened", { kind, url });
      router.push(url as never);
    });

    return () => subscription.remove();
  }, [posthog, router]);

  useEffect(() => {
    const timeout = setTimeout(() => setShowSplash(false), 2600);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#F7F1E8" },
        }}
      />
      {showSplash ? <AppSplash /> : null}
      <StatusBar style={showSplash ? "light" : "dark"} />
    </>
  );
}

function PostHogWrapper() {
  return (
    <PostHogProvider
      apiKey={posthogConfig.apiKey}
      options={posthogConfig.options}
    >
      <RootLayoutInner />
    </PostHogProvider>
  );
}

const SentryApp = Sentry.wrap(PostHogWrapper);

export default function RootLayout() {
  return <SentryApp />;
}
