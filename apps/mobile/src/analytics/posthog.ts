import { PostHogProvider } from "posthog-react-native";

const API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? "";
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

export { PostHogProvider };

export const posthogConfig = {
  apiKey: API_KEY,
  options: {
    host: HOST,
    flushAt: 20,
    flushInterval: 30_000,
    disabled: !API_KEY,
  },
};
