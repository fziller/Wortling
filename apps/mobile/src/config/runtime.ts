import Constants from "expo-constants";

type AppVariant = "development" | "preview" | "production";

const appVariant = (Constants.expoConfig?.extra?.appVariant ?? "production") as AppVariant;

export const isDebugBuild = __DEV__ || appVariant === "development" || appVariant === "preview";
export const isPreviewBuild = appVariant === "preview";
