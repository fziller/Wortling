import { useRouter } from "expo-router";

import { APP_HEADER_BACKGROUND, HeaderActionButton, PageHeader } from "@/components/AppHeader";

export const HOME_HEADER_BACKGROUND = APP_HEADER_BACKGROUND;

export function HomeTopBar({ onHelp }: { onHelp?: () => void }) {
  const router = useRouter();

  return (
    <PageHeader
      leftAction={<HeaderActionButton accessibilityLabel="Statistiken öffnen" icon="bar-chart-2" onPress={() => router.push("/stats")} />}
      onTitlePress={onHelp}
      rightAction={<HeaderActionButton accessibilityLabel="Einstellungen öffnen" icon="settings" onPress={() => router.push("/settings")} />}
      title="WORTKNIFF"
      titleAccessibilityLabel="Tageskniffe erklären"
      titleVariant="brand"
    />
  );
}
