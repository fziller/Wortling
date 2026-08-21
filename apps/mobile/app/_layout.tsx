import "react-native-gesture-handler";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Sentry from "@sentry/react-native";
import { PostHogProvider } from "posthog-react-native";
import { useEffect, useState } from "react";

import { AppSplash } from "@/components/AppSplash";
import { initSentry } from "@/monitoring/sentry";
import { posthogConfig } from "@/analytics/posthog";
import { configureNotifications } from "@/notifications/configure";
import { scheduleDailyReminder } from "@/notifications/scheduler";

initSentry();

function RootLayoutInner() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    try {
      configureNotifications();
    } catch {
      // Notifications are nice-to-have; startup must stay offline-safe.
    }

    scheduleDailyReminder().catch(() => {});
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setShowSplash(false), 1600);
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
