import * as Application from "expo-application";
import { updateId } from "expo-updates";

// Short EAS Update ID of the currently running update (8 chars).
// Null in dev, Expo Go, or builds without an OTA update — never crashes offline.
function shortUpdateId(): string | null {
  return updateId ? updateId.slice(0, 8) : null;
}

// Splash footer: "v0.9.9 • 1a2b3c4d" (update part omitted when unavailable).
export function getSplashBuildLabel(): string {
  const version = Application.nativeApplicationVersion ?? "?";
  const short = shortUpdateId();
  return short ? `v${version} • ${short}` : `v${version}`;
}

// Settings "Über Wortkniff" line, e.g. "Version 0.9.9 (Build 9) • Update 1a2b3c4d".
export function getBuildLabel(): string {
  const version = Application.nativeApplicationVersion ?? "?";
  const build = Application.nativeBuildVersion ?? "?";
  const short = shortUpdateId();
  return short ? `Version ${version} (Build ${build}) • Update ${short}` : `Version ${version} (Build ${build})`;
}
