import * as Application from "expo-application";
import { useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useEffect, useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { AppCard } from "@/components/AppCard";
import { APP_HEADER_BACKGROUND, PageHeader } from "@/components/AppHeader";
import { captureEvent } from "@/analytics/events";
import { Screen } from "@/components/Screen";
import { getBerlinDateKey } from "@/daily/date";
import { createDailyKniffeSeed, generateDailyKniffe } from "@/dailyKniffe";
import { tokens } from "@/design/tokens";
import { gameRegistry, games } from "@/games/registry";
import { clearDailyKniffeSeedOverride, loadDailyKniffeSeedOverride, saveDailyKniffeSeedOverride } from "@/storage/dailyKniffeDev";
import { loadNotificationSettings, saveNotificationSettings, NotificationSettings } from "@/storage/settings";
import { BUCKET_PRESET_DESCRIPTIONS } from "@/games/wordBuckets";
import { loadWordBucketSettings, saveWordBucketSettings, WordBucketSettings } from "@/storage/wordBuckets";
import { requestNotificationPermission } from "@/notifications/register";
import { presentDevNotification, scheduleDailyReminder } from "@/notifications/scheduler";
import { currentNews } from "@/news/current";
import { resetNews } from "@/news/storage";
import { resetOnboarding } from "@/onboarding/storage";
import { PACKS } from "@/games/wordConfig";
import { HINT_MAX_BALANCE, HINT_STORAGE_VERSION, type HintWallet } from "@/hints/types";
import { loadHintWallet, saveHintWallet } from "@/hints/storage";
import { loadPacksSettings, savePacksSettings, type PacksSettings } from "@/storage/packs";
import { hasPremiumAccess, isPackGated, setMockPremiumEnabled } from "@/premium/packsAccess";

const DWDS_URL = "https://www.dwds.de/lemma/list";
const CC_BY_SA_URL = "https://creativecommons.org/licenses/by-sa/4.0/";

export default function SettingsScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    hour: 18,
    minute: 0,
    unfinishedEnabled: true,
  });
  const [bucketSettings, setBucketSettings] = useState<WordBucketSettings>({ erweitert: false, hart: false });
  const [packsSettings, setPacksSettings] = useState<PacksSettings>({ bio: { enabled: false, frequency: "normal" } });
  const [canUsePacks, setCanUsePacks] = useState(true);
  const [packsGated, setPacksGated] = useState(false);
  const [dailyKniffeSeedOverride, setDailyKniffeSeedOverride] = useState<number | undefined>();
  const [hintWallet, setHintWallet] = useState<HintWallet | null>(null);
  const [devStatus, setDevStatus] = useState("");
  const dateKey = getBerlinDateKey();
  const productionSeed = createDailyKniffeSeed(dateKey);
  const generatedKniffe = useMemo(() => generateDailyKniffe({
    dateKey,
    devConfig: { seedOverride: dailyKniffeSeedOverride },
    games,
  }), [dailyKniffeSeedOverride, dateKey]);

  useEffect(() => {
    captureEvent(posthog, "screen_viewed", { screen: "settings", params: { dateKey } });
    loadNotificationSettings().then(setSettings);
    loadWordBucketSettings().then(setBucketSettings);
    loadDailyKniffeSeedOverride().then(setDailyKniffeSeedOverride);
    if (__DEV__) loadHintWallet().then(setHintWallet);
    loadPacksSettings().then(setPacksSettings);
    setPacksGated(isPackGated());
    hasPremiumAccess().then(setCanUsePacks);
  }, [dateKey, posthog]);

  async function updateAndReschedule(next: NotificationSettings) {
    setSettings(next);
    await saveNotificationSettings(next);
    await scheduleDailyReminder();
  }

  async function toggleEnabled() {
    if (!settings.enabled) {
      const granted = await requestNotificationPermission();
      captureEvent(posthog, "notification_permission_result", { granted, source: "settings" });
      if (!granted) return;
    }
    const enabled = !settings.enabled;
    await updateAndReschedule({ ...settings, enabled });
    captureEvent(posthog, "settings_changed", { key: "daily_reminder", value: String(enabled) });
  }

  async function toggleUnfinishedEnabled() {
    const unfinishedEnabled = !settings.unfinishedEnabled;
    await updateAndReschedule({ ...settings, unfinishedEnabled });
    captureEvent(posthog, "settings_changed", { key: "unfinished_reminder", value: String(unfinishedEnabled) });
  }

  async function toggleErweitert() {
    const next = { ...bucketSettings, erweitert: !bucketSettings.erweitert, hart: bucketSettings.hart && !bucketSettings.erweitert ? false : bucketSettings.hart };
    // hart implies erweitert, so if hart is on and we disable erweitert, also disable hart
    const fixed = next.hart && !next.erweitert ? { ...next, hart: false } : next;
    // if enabling erweitert while hart was off, keep hart off; if enabling hart later, it will set both
    setBucketSettings(fixed);
    await saveWordBucketSettings(fixed);
    captureEvent(posthog, "settings_changed", { key: "word_bucket", value: fixed.hart ? "hart" : fixed.erweitert ? "erweitert" : "klassisch" });
  }

  async function toggleHart() {
    const next = bucketSettings.hart ? { ...bucketSettings, hart: false } : { erweitert: true, hart: true };
    setBucketSettings(next);
    await saveWordBucketSettings(next);
    captureEvent(posthog, "settings_changed", { key: "word_bucket", value: next.hart ? "hart" : next.erweitert ? "erweitert" : "klassisch" });
  }

  async function toggleBioPack() {
    if (packsGated && !canUsePacks) return;
    const next = { ...packsSettings, bio: { ...packsSettings.bio, enabled: !packsSettings.bio.enabled } };
    setPacksSettings(next);
    await savePacksSettings(next);
    captureEvent(posthog, "settings_changed", { key: "pack_bio_enabled", value: String(next.bio.enabled) });
  }

  async function setBioFrequency(freq: "normal" | "haeufig") {
    if (packsGated && !canUsePacks) return;
    const next = { ...packsSettings, bio: { ...packsSettings.bio, frequency: freq } };
    setPacksSettings(next);
    await savePacksSettings(next);
    captureEvent(posthog, "settings_changed", { key: "pack_bio_frequency", value: freq });
  }

  async function handlePremiumCta() {
    // Mock: in dev, toggle premium; in prod, open paywall screen.
    // For now, grant mock premium when gated.
    if (packsGated) {
      await setMockPremiumEnabled(true);
      setCanUsePacks(true);
      captureEvent(posthog, "settings_changed", { key: "mock_premium", value: "true" });
    }
  }

  function adjustHour(delta: number) {
    const next = { ...settings, hour: (settings.hour + delta + 24) % 24 };
    updateAndReschedule(next);
    captureEvent(posthog, "settings_changed", { key: "daily_reminder_time", value: `${String(next.hour).padStart(2, "0")}:${String(next.minute).padStart(2, "0")}` });
  }

  function adjustMinute(delta: number) {
    const next = { ...settings, minute: (settings.minute + delta + 60) % 60 };
    updateAndReschedule(next);
    captureEvent(posthog, "settings_changed", { key: "daily_reminder_time", value: `${String(next.hour).padStart(2, "0")}:${String(next.minute).padStart(2, "0")}` });
  }

  async function createNewDailyKniffeSeed() {
    const nextSeed = Math.floor(Math.random() * 1_000_000_000);
    setDailyKniffeSeedOverride(nextSeed);
    await saveDailyKniffeSeedOverride(nextSeed);
  }

  async function resetDailyKniffeSeed() {
    setDailyKniffeSeedOverride(undefined);
    await clearDailyKniffeSeedOverride();
  }

  async function resetOnboardingDev() {
    await resetOnboarding();
    setDevStatus("Onboarding wird beim nächsten Home-Besuch wieder angezeigt.");
    captureEvent(posthog, "onboarding_completed", { dateKey, action: "reset" });
  }

  async function testNotification(kind: "daily" | "unfinished") {
    const granted = await requestNotificationPermission();
    captureEvent(posthog, "notification_permission_result", { granted, source: "dev" });
    if (!granted) {
      setDevStatus("Notification-Berechtigung fehlt.");
      return;
    }

    await presentDevNotification(kind);
    setDevStatus(`Notification ausgelöst: ${kind}`);
    captureEvent(posthog, "notification_tested", { kind });
  }

  async function resetNewsDev() {
    if (!currentNews) {
      setDevStatus("Keine News konfiguriert.");
      return;
    }

    await resetNews();
    setDevStatus(`News wird beim nächsten Home-Besuch angezeigt: ${currentNews.id}`);
  }

  async function setDevHintBalance(balance: number) {
    const next = {
      version: HINT_STORAGE_VERSION,
      balance,
      winsSinceLastHint: 0,
      totalEarned: balance,
      totalSpent: 0,
    };

    setHintWallet(next);
    await saveHintWallet(next);
    setDevStatus(`Hinweise gesetzt: ${balance}/${HINT_MAX_BALANCE}`);
  }

  const timeLabel = `${String(settings.hour).padStart(2, "0")}:${String(settings.minute).padStart(2, "0")}`;

  return (
    <Screen header={<PageHeader onBack={() => router.back()} title="Einstellungen" />} headerBackgroundColor={APP_HEADER_BACKGROUND}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(80).duration(tokens.motion.normal)}>
          <AppCard>
            <Text style={styles.cardTitle}>Erinnerung</Text>
            <Text style={styles.body}>
              Lass dich täglich an die Rätsel erinnern. Die Notification kommt einmal am Tag zur konfigurierten Uhrzeit.
            </Text>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Tägliche Erinnerung</Text>
              <AnimatedSwitch checked={settings.enabled} onPress={toggleEnabled} />
            </View>
            {settings.enabled ? (
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Uhrzeit</Text>
                <Text style={styles.timeValue}>{timeLabel}</Text>
                <View style={styles.timeStepperGrid}>
                  <View style={styles.timeStepper}>
                    <Text style={styles.stepperLabel}>Stunde</Text>
                    <View style={styles.stepperButtons}>
                      <Pressable accessibilityRole="button" onPress={() => adjustHour(-1)} style={styles.timeButton}>
                        <Text style={styles.timeButtonText}>-</Text>
                      </Pressable>
                      <Pressable accessibilityRole="button" onPress={() => adjustHour(1)} style={styles.timeButton}>
                        <Text style={styles.timeButtonText}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                  <View style={styles.timeStepper}>
                    <Text style={styles.stepperLabel}>Minuten</Text>
                    <View style={styles.stepperButtons}>
                      <Pressable accessibilityRole="button" onPress={() => adjustMinute(-5)} style={styles.timeButton}>
                        <Text style={styles.timeButtonText}>-</Text>
                      </Pressable>
                      <Pressable accessibilityRole="button" onPress={() => adjustMinute(5)} style={styles.timeButton}>
                        <Text style={styles.timeButtonText}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
                <View style={styles.toggleRow}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.toggleLabel}>Abend-Erinnerung</Text>
                    <Text style={styles.bucketDesc}>Nur wenn du heute angefangen hast und noch Tageskniffe offen sind. Kommt um 20:30.</Text>
                  </View>
                  <AnimatedSwitch checked={settings.unfinishedEnabled} onPress={toggleUnfinishedEnabled} />
                </View>
              </View>
            ) : null}
          </AppCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(tokens.motion.normal)}>
          <AppCard>
            <Text style={styles.cardTitle}>Wortschatz</Text>
            <Text style={styles.body}>Wähle, welche Wortarten als Lösung vorkommen. Gilt für alle Spiele und Tageskniffe. Klassisch ist immer aktiv.</Text>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.toggleLabel}>Klassisch</Text>
                <Text style={styles.bucketDesc}>{BUCKET_PRESET_DESCRIPTIONS.klassisch}</Text>
              </View>
              <AnimatedSwitch checked disabled />
            </View>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.toggleLabel}>Erweitert</Text>
                <Text style={styles.bucketDesc}>{BUCKET_PRESET_DESCRIPTIONS.erweitert}</Text>
              </View>
              <AnimatedSwitch checked={bucketSettings.erweitert} onPress={toggleErweitert} />
            </View>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.toggleLabel}>Hart</Text>
                <Text style={styles.bucketDesc}>{BUCKET_PRESET_DESCRIPTIONS.hart}</Text>
              </View>
              <AnimatedSwitch checked={bucketSettings.hart} onPress={toggleHart} />
            </View>
            <Text style={styles.versionText}>Aktiv: {bucketSettings.hart ? "Hart" : bucketSettings.erweitert ? "Erweitert" : "Klassisch"} · Ab nächster Runde wirksam.</Text>
          </AppCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(130).duration(tokens.motion.normal)}>
          <AppCard>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>Wort-Pakete</Text>
              <View style={styles.premiumBadge}><Text style={styles.premiumBadgeText}>Bald</Text></View>
            </View>
            <Text style={styles.body}>
              Themenpakete bringen später frische Lösungswörter in alle Spiele. Die Technik ist vorbereitet, die Auswahl bleibt bis zum Launch noch kuratiert.
            </Text>
            <View style={styles.packGrid}>
              <PackPreview title="Biologie" body="Pflanzen, Tiere, Körper, Labor." />
              <PackPreview title="Küche" body="Essen, Gewürze, Kochen." />
              <PackPreview title="Reise" body="Städte, Länder, Orte." />
              <PackPreview title="Sport" body="Teams, Bewegung, Wettkampf." />
            </View>
          </AppCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).duration(tokens.motion.normal)}>
          <AppCard>
            <Text style={styles.cardTitle}>Über Wortkniff</Text>
            <Text style={styles.body}>
              Wortkniff ist eine mobile Wortspiel-App für deutsche Wörter. Jeden Tag warten kurze Rätsel wie
              Dazwischen, Doppel, Galgenwort, Formwort, Worttreffer und Wortcode.
            </Text>
            <Text style={styles.versionText}>
              Version {Application.nativeApplicationVersion ?? "?"} (Build {Application.nativeBuildVersion ?? "?"})
            </Text>
          </AppCard>
        </Animated.View>

        {__DEV__ ? (
          <Animated.View entering={FadeInDown.delay(170).duration(tokens.motion.normal)}>
            <AppCard>
              <Text style={styles.cardTitle}>DEV Menü</Text>
              <Text style={styles.body}>
                {dailyKniffeSeedOverride === undefined ? "Production-Auswahl aktiv." : "DEV Daily Override aktiv."}
              </Text>
              <Text style={styles.versionText}>Datum: {dateKey}</Text>
              <Text style={styles.versionText}>Quest Seed: {dailyKniffeSeedOverride ?? productionSeed}</Text>
              <Text style={styles.versionText}>Hinweise: {hintWallet?.balance ?? 0}/{HINT_MAX_BALANCE}</Text>
              <View style={styles.devGenerated}>
                <Text style={styles.stepperLabel}>Generated</Text>
                {generatedKniffe.map((kniff) => (
                  <Text key={kniff.id} style={styles.devGameText}>• {gameRegistry[kniff.gameId]?.title ?? kniff.gameId}</Text>
                ))}
              </View>
              <View style={styles.devActions}>
                <Pressable accessibilityRole="button" onPress={createNewDailyKniffeSeed} style={styles.devButton}>
                  <Text style={styles.devButtonText}>🎲 Neuer Seed</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={resetDailyKniffeSeed} style={styles.devButtonSecondary}>
                  <Text style={styles.devButtonSecondaryText}>Seed Override zurücksetzen</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={resetOnboardingDev} style={styles.devButtonSecondary}>
                  <Text style={styles.devButtonSecondaryText}>Onboarding neu triggern</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={resetNewsDev} style={styles.devButtonSecondary}>
                  <Text style={styles.devButtonSecondaryText}>News neu triggern</Text>
                </Pressable>
                <View style={styles.devHintRow}>
                  {Array.from({ length: HINT_MAX_BALANCE + 1 }).map((_, value) => (
                    <Pressable accessibilityRole="button" key={value} onPress={() => setDevHintBalance(value)} style={styles.devHintButton}>
                      <Text style={styles.devButtonSecondaryText}>Hinweise {value}</Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable accessibilityRole="button" onPress={() => testNotification("daily")} style={styles.devButtonSecondary}>
                  <Text style={styles.devButtonSecondaryText}>Notification testen: Daily</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => testNotification("unfinished")} style={styles.devButtonSecondary}>
                  <Text style={styles.devButtonSecondaryText}>Notification testen: Offen</Text>
                </Pressable>
                {devStatus ? <Text style={styles.versionText}>{devStatus}</Text> : null}
              </View>
            </AppCard>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(200).duration(tokens.motion.normal)}>
          <AppCard>
            <Text style={styles.cardTitle}>Wortdaten</Text>
            <Text style={styles.body}>
              Die Wortliste wird lokal mit der App ausgeliefert. Grundlage sind die DWDS-Lemmadatenbank von DWDS -
              Digitales Wörterbuch der deutschen Sprache, veröffentlicht von der Berlin-Brandenburgischen Akademie
              der Wissenschaften, sowie das German POS Dictionary von LanguageTool.
            </Text>
            <Text style={styles.body}>
              Die generierte Spielliste wird für fünf Buchstaben gefiltert und angepasst. Zielwörter werden zusätzlich
              manuell kuratiert, damit die Runden fair bleiben.
            </Text>
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(DWDS_URL)} style={styles.linkButton}>
              <Text style={styles.linkText}>DWDS-Lemmadatenbank</Text>
            </Pressable>
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(CC_BY_SA_URL)} style={styles.linkButton}>
              <Text style={styles.linkText}>Lizenz: CC BY-SA 4.0</Text>
            </Pressable>
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL("https://github.com/languagetool-org/german-pos-dict")} style={styles.linkButton}>
              <Text style={styles.linkText}>German POS Dictionary</Text>
            </Pressable>
          </AppCard>
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}

function AnimatedSwitch({ checked, onPress, disabled }: { checked: boolean; onPress?: () => void; disabled?: boolean }) {
  const progress = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(checked ? 1 : 0, { duration: tokens.motion.quick });
  }, [checked, progress]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [tokens.color.line, tokens.color.primary]),
  }));

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 22 }],
  }));

  if (disabled) {
    return (
      <Animated.View style={[styles.toggle, trackStyle, styles.toggleDisabled]}>
        <Animated.View style={[styles.toggleKnob, knobStyle]} />
      </Animated.View>
    );
  }

  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked }} onPress={onPress} disabled={disabled}>
      <Animated.View style={[styles.toggle, trackStyle]}>
        <Animated.View style={[styles.toggleKnob, knobStyle]} />
      </Animated.View>
    </Pressable>
  );
}

function PackPreview({ body, title }: { body: string; title: string }) {
  return (
    <View style={styles.packPreview}>
      <View style={styles.packPreviewHeader}>
        <Text style={styles.packPreviewTitle}>{title}</Text>
        <Text style={styles.packPreviewBadge}>Bald</Text>
      </View>
      <Text style={styles.bucketDesc}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: tokens.space.lg,
    paddingBottom: tokens.space.xl
  },
  cardTitle: {
    color: tokens.color.ink,
    fontSize: tokens.type.h2,
    fontFamily: tokens.font.ui.semibold,
    marginBottom: tokens.space.sm
  },
  body: {
    color: tokens.color.muted,
    ...tokens.typography.uiBody,
    marginBottom: tokens.space.md
  },
  versionText: {
    color: tokens.color.muted,
    fontSize: tokens.type.small,
    fontFamily: tokens.font.ui.medium,
  },
  linkButton: {
    alignSelf: "flex-start",
    paddingVertical: tokens.space.xs
  },
  linkText: {
    color: tokens.color.secondary,
    fontSize: tokens.type.body,
    fontFamily: tokens.font.ui.semibold,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: tokens.space.md
  },
  toggleLabel: {
    color: tokens.color.ink,
    fontSize: tokens.type.body,
    fontFamily: tokens.font.ui.semibold,
  },
  toggle: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: tokens.color.line,
    justifyContent: "center",
    paddingHorizontal: 3,
    overflow: "hidden"
  },
  toggleOn: {
    backgroundColor: tokens.color.primary
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "white"
  },
  toggleKnobOn: {
    // kept for backward compat, animation now uses translateX
  },
  toggleDisabled: {
    opacity: 0.6
  },
  bucketDesc: {
    color: tokens.color.muted,
    fontFamily: tokens.font.ui.regular,
    fontSize: tokens.type.small,
    lineHeight: 16,
    marginTop: 2
  },
  timeRow: {
    gap: tokens.space.sm
  },
  timeLabel: {
    color: tokens.color.muted,
    fontSize: tokens.type.small,
    fontFamily: tokens.font.ui.medium,
  },
  timeValue: {
    color: tokens.color.ink,
    fontSize: 44,
    fontFamily: tokens.font.ui.semibold,
    letterSpacing: -1.5
  },
  timeStepperGrid: {
    flexDirection: "row",
    gap: tokens.space.md
  },
  timeStepper: {
    flex: 1,
    gap: tokens.space.xs
  },
  stepperLabel: {
    color: tokens.color.muted,
    fontSize: tokens.type.small,
    fontFamily: tokens.font.ui.medium,
  },
  stepperButtons: {
    flexDirection: "row",
    gap: tokens.space.sm
  },
  timeButton: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.action,
    backgroundColor: tokens.surface.control,
    borderWidth: 1,
    borderColor: tokens.border.control
  },
  timeButtonText: {
    color: tokens.color.ink,
    fontSize: 20,
    fontFamily: tokens.font.ui.semibold,
  },
  devGenerated: {
    gap: tokens.space.xs,
    marginTop: tokens.space.md,
    marginBottom: tokens.space.md
  },
  devGameText: {
    color: tokens.color.ink,
    fontSize: tokens.type.body,
    fontFamily: tokens.font.ui.semibold,
  },
  devActions: {
    gap: tokens.space.sm
  },
  devHintRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.space.xs,
  },
  devHintButton: {
    flexGrow: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: tokens.space.sm,
    borderRadius: tokens.radius.action,
    borderWidth: 1,
    borderColor: tokens.border.control,
    backgroundColor: tokens.surface.control,
  },
  devButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.control,
    backgroundColor: tokens.color.primary
  },
  devButtonText: {
    color: "white",
    fontSize: tokens.type.body,
    fontFamily: tokens.font.ui.semibold,
  },
  devButtonSecondary: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.control,
    borderWidth: 1,
    borderColor: tokens.border.control,
    backgroundColor: tokens.surface.control
  },
  devButtonSecondaryText: {
    color: tokens.color.ink,
    fontSize: tokens.type.body,
    fontFamily: tokens.font.ui.semibold,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: tokens.space.sm
  },
  premiumBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: tokens.radius.badge,
    backgroundColor: tokens.color.primary
  },
  premiumBadgeText: {
    color: "white",
    fontSize: tokens.type.small,
    fontFamily: tokens.font.ui.semibold,
    letterSpacing: 0.6,
    textTransform: "uppercase"
  },
  premiumLocked: {
    gap: tokens.space.sm,
    padding: tokens.space.md,
    borderRadius: tokens.radius.control,
    backgroundColor: tokens.surface.control,
  },
  premiumLockedText: {
    color: tokens.color.ink,
    fontSize: tokens.type.body,
    fontFamily: tokens.font.ui.regular,
    lineHeight: 20
  },
  premiumButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.control,
    backgroundColor: tokens.color.primary,
    paddingHorizontal: tokens.space.md
  },
  premiumButtonText: {
    color: "white",
    fontSize: tokens.type.body,
    fontFamily: tokens.font.ui.semibold,
  },
  frequencyRow: {
    gap: tokens.space.xs,
    marginBottom: tokens.space.md
  },
  frequencyButtons: {
    flexDirection: "row",
    gap: tokens.space.sm,
    marginTop: tokens.space.xs
  },
  frequencyButton: {
    flex: 1,
    gap: 2,
    paddingVertical: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    borderRadius: tokens.radius.action,
    borderWidth: 1,
    borderColor: tokens.border.control,
    backgroundColor: tokens.surface.control,
    alignItems: "center"
  },
  frequencyButtonActive: {
    borderColor: tokens.color.primary,
    backgroundColor: tokens.color.primaryLight
  },
  frequencyButtonText: {
    color: tokens.color.ink,
    fontSize: tokens.type.body,
    fontFamily: tokens.font.ui.semibold,
  },
  frequencyButtonTextActive: {
    color: tokens.color.primaryDark
  },
  packGrid: {
    gap: tokens.space.sm,
  },
  packPreview: {
    gap: 3,
    padding: tokens.space.md,
    borderRadius: tokens.radius.control,
    backgroundColor: tokens.surface.control,
  },
  packPreviewHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: tokens.space.sm,
  },
  packPreviewTitle: {
    color: tokens.color.ink,
    fontSize: tokens.type.body,
    fontFamily: tokens.font.ui.semibold,
  },
  packPreviewBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: tokens.radius.badge,
    backgroundColor: tokens.color.primaryLight,
    color: tokens.color.primaryDark,
    fontSize: 11,
    fontFamily: tokens.font.ui.medium,
  }
});
