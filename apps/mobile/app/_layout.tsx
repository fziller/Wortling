import "react-native-gesture-handler";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Sentry from "@sentry/react-native";
import { PostHogProvider } from "posthog-react-native";

import { initSentry } from "@/monitoring/sentry";
import { posthogConfig } from "@/analytics/posthog";

initSentry();

function RootLayoutInner() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#F7F1E8" },
        }}
      />
      <StatusBar style="dark" />
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
