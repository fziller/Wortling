import type { ExpoConfig } from "@expo/config-types";

type Variant = "development" | "preview" | "production";

const variant = (process.env.APP_VARIANT ?? "production") as Variant;

const bundleIdentifier = (): string => {
  if (variant === "development") return "com.existuus.wortling.dev";
  if (variant === "preview") return "com.existuus.wortling.preview";
  return "com.existuus.wortling";
};

const appName = (): string => {
  if (variant === "development") return "Wortkniff Dev";
  if (variant === "preview") return "Wortkniff Preview";
  return "Wortkniff";
};

export default ({ config }: { config: ExpoConfig }): ExpoConfig => ({
  ...config,
  name: appName(),
  ios: {
    ...config.ios,
    bundleIdentifier: bundleIdentifier(),
  },
  android: {
    ...config.android,
    package: bundleIdentifier(),
  },
});