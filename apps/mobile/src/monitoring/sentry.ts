import * as Sentry from "@sentry/react-native";

export function initSentry(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    if (__DEV__) {
      console.warn("[Sentry] No DSN configured, skipping init.");
    }
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment: __DEV__ ? "development" : "production",
      tracesSampleRate: __DEV__ ? 1.0 : 0.2,
      enableAutoSessionTracking: true,
      sessionTrackingIntervalMillis: 30_000,
      attachStacktrace: true,
    });
  } catch {
    if (__DEV__) {
      console.warn("[Sentry] Init failed, continuing without error reporting.");
    }
  }
}
