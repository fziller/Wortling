import * as Application from "expo-application";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { AppCard } from "@/components/AppCard";
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
import { scheduleDailyReminder } from "@/notifications/scheduler";
import { PACKS } from "@/games/wordConfig";
import { loadPacksSettings, savePacksSettings, type PacksSettings } from "@/storage/packs";
import { hasPremiumAccess, isPackGated, setMockPremiumEnabled } from "@/premium/packsAccess";

const DWDS_URL = "https://www.dwds.de/lemma/list";
const CC_BY_SA_URL = "https://creativecommons.org/licenses/by-sa/4.0/";

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    hour: 18,
    minute: 0,
  });
  const [bucketSettings, setBucketSettings] = useState<WordBucketSettings>({ erweitert: false, hart: false });
  const [packsSettings, setPacksSettings] = useState<PacksSettings>({ bio: { enabled: false, frequency: "normal" } });
  const [canUsePacks, setCanUsePacks] = useState(true);
  const [packsGated, setPacksGated] = useState(false);
  const [dailyKniffeSeedOverride, setDailyKniffeSeedOverride] = useState<number | undefined>();
  const dateKey = getBerlinDateKey();
  const productionSeed = createDailyKniffeSeed(dateKey);
  const generatedKniffe = useMemo(() => generateDailyKniffe({
    dateKey,
    devConfig: { seedOverride: dailyKniffeSeedOverride },
    games,
  }), [dailyKniffeSeedOverride, dateKey]);

  useEffect(() => {
    loadNotificationSettings().then(setSettings);
    loadWordBucketSettings().then(setBucketSettings);
    loadDailyKniffeSeedOverride().then(setDailyKniffeSeedOverride);
    loadPacksSettings().then(setPacksSettings);
    setPacksGated(isPackGated());
    hasPremiumAccess().then(setCanUsePacks);
  }, []);

  async function updateAndReschedule(next: NotificationSettings) {
    setSettings(next);
    await saveNotificationSettings(next);
    await scheduleDailyReminder();
  }

  async function toggleEnabled() {
    if (!settings.enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
    }
    await updateAndReschedule({ ...settings, enabled: !settings.enabled });
  }

  async function toggleErweitert() {
    const next = { ...bucketSettings, erweitert: !bucketSettings.erweitert, hart: bucketSettings.hart && !bucketSettings.erweitert ? false : bucketSettings.hart };
    // hart implies erweitert, so if hart is on and we disable erweitert, also disable hart
    const fixed = next.hart && !next.erweitert ? { ...next, hart: false } : next;
    // if enabling erweitert while hart was off, keep hart off; if enabling hart later, it will set both
    setBucketSettings(fixed);
    await saveWordBucketSettings(fixed);
  }

  async function toggleHart() {
    const next = bucketSettings.hart ? { ...bucketSettings, hart: false } : { erweitert: true, hart: true };
    setBucketSettings(next);
    await saveWordBucketSettings(next);
  }

  async function toggleBioPack() {
    if (packsGated && !canUsePacks) return;
    const next = { ...packsSettings, bio: { ...packsSettings.bio, enabled: !packsSettings.bio.enabled } };
    setPacksSettings(next);
    await savePacksSettings(next);
  }

  async function setBioFrequency(freq: "normal" | "haeufig") {
    if (packsGated && !canUsePacks) return;
    const next = { ...packsSettings, bio: { ...packsSettings.bio, frequency: freq } };
    setPacksSettings(next);
    await savePacksSettings(next);
  }

  async function handlePremiumCta() {
    // Mock: in dev, toggle premium; in prod, open paywall screen.
    // For now, grant mock premium when gated.
    if (packsGated) {
      await setMockPremiumEnabled(true);
      setCanUsePacks(true);
    }
  }

  function adjustHour(delta: number) {
    const next = { ...settings, hour: (settings.hour + delta + 24) % 24 };
    updateAndReschedule(next);
  }

  function adjustMinute(delta: number) {
    const next = { ...settings, minute: (settings.minute + delta + 60) % 60 };
    updateAndReschedule(next);
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

  const timeLabel = `${String(settings.hour).padStart(2, "0")}:${String(settings.minute).padStart(2, "0")}`;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(tokens.motion.normal)} style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Zurück</Text>
          </Pressable>
          <Text style={styles.kicker}>Wortkniff</Text>
          <Text style={styles.title}>Einstellungen</Text>
        </Animated.View>

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
              {packsGated ? <View style={styles.premiumBadge}><Text style={styles.premiumBadgeText}>Premium</Text></View> : null}
            </View>
            <Text style={styles.body}>
              Zusatzwörter für alle Spiele (4–7 Buchstaben). Bio-Wörter sind immer als Tipp erlaubt — das Paket beeinflusst nur, wie oft sie als Lösung kommen. Gilt für alle Spiele ab nächster Runde.
            </Text>
            {packsGated && !canUsePacks ? (
              <View style={styles.premiumLocked}>
                <Text style={styles.premiumLockedText}>🔒 Biologie-Paket ist ein Premium-Feature. Schalte es frei, um Bio-Wörter als Lösung zu bekommen.</Text>
                <Pressable accessibilityRole="button" onPress={handlePremiumCta} style={styles.premiumButton}>
                  <Text style={styles.premiumButtonText}>Freischalten (Mock)</Text>
                </Pressable>
                <Text style={styles.versionText}>Flag: EXPO_PUBLIC_PACKS_GATED=true → paywall. Ohne Flag: frei. Siehe src/premium/packsAccess.ts</Text>
              </View>
            ) : (
              <>
                <View style={styles.toggleRow}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.toggleLabel}>{PACKS.bio.label}</Text>
                    <Text style={styles.bucketDesc}>{PACKS.bio.description}</Text>
                    <Text style={styles.versionText}>4–7 Buchstaben · {packsSettings.bio.enabled ? "an" : "aus"} · Nächste Runde wirksam</Text>
                  </View>
                  <AnimatedSwitch checked={packsSettings.bio.enabled} onPress={toggleBioPack} />
                </View>
                {packsSettings.bio.enabled ? (
                  <View style={styles.frequencyRow}>
                    <Text style={styles.stepperLabel}>Häufigkeit</Text>
                    <View style={styles.frequencyButtons}>
                      <Pressable accessibilityRole="button" onPress={() => setBioFrequency("normal")} style={[styles.frequencyButton, packsSettings.bio.frequency === "normal" && styles.frequencyButtonActive]}>
                        <Text style={[styles.frequencyButtonText, packsSettings.bio.frequency === "normal" && styles.frequencyButtonTextActive]}>Normal</Text>
                        <Text style={styles.bucketDesc}>Im Mix (~2%)</Text>
                      </Pressable>
                      <Pressable accessibilityRole="button" onPress={() => setBioFrequency("haeufig")} style={[styles.frequencyButton, packsSettings.bio.frequency === "haeufig" && styles.frequencyButtonActive]}>
                        <Text style={[styles.frequencyButtonText, packsSettings.bio.frequency === "haeufig" && styles.frequencyButtonTextActive]}>Häufig</Text>
                        <Text style={styles.bucketDesc}>70% Bio / 30% Mix</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
                {__DEV__ && packsGated ? (
                  <Pressable accessibilityRole="button" onPress={async () => { await setMockPremiumEnabled(false); setCanUsePacks(false); }} style={styles.linkButton}>
                    <Text style={styles.linkText}>DEV: Premium entziehen</Text>
                  </Pressable>
                ) : null}
              </>
            )}
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
              <Text style={styles.cardTitle}>DEV Tageskniffe</Text>
              <Text style={styles.body}>
                {dailyKniffeSeedOverride === undefined ? "Production-Auswahl aktiv." : "DEV Daily Override aktiv."}
              </Text>
              <Text style={styles.versionText}>Datum: {dateKey}</Text>
              <Text style={styles.versionText}>Quest Seed: {dailyKniffeSeedOverride ?? productionSeed}</Text>
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
    progress.value = withTiming(checked ? 1 : 0, { duration: 160 });
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

const styles = StyleSheet.create({
  scroll: {
    gap: tokens.space.lg,
    paddingBottom: tokens.space.xl
  },
  header: {
    gap: tokens.space.sm,
    paddingTop: tokens.space.md
  },
  backButton: {
    alignSelf: "flex-start",
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
    borderWidth: 1,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.pill,
    backgroundColor: "rgba(255, 255, 255, 0.62)"
  },
  backButtonText: {
    color: tokens.color.ink,
    fontWeight: "900"
  },
  kicker: {
    color: tokens.color.primaryDark,
    fontSize: tokens.type.small,
    fontWeight: "900",
    letterSpacing: 1.6,
    textTransform: "uppercase"
  },
  title: {
    color: tokens.color.ink,
    fontSize: tokens.type.title,
    fontWeight: "900",
    letterSpacing: -1.8
  },
  cardTitle: {
    color: tokens.color.ink,
    fontSize: tokens.type.h2,
    fontWeight: "900",
    marginBottom: tokens.space.sm
  },
  body: {
    color: tokens.color.muted,
    fontSize: tokens.type.body,
    lineHeight: 24,
    marginBottom: tokens.space.md
  },
  versionText: {
    color: tokens.color.muted,
    fontSize: tokens.type.small,
    fontWeight: "700"
  },
  linkButton: {
    alignSelf: "flex-start",
    paddingVertical: tokens.space.xs
  },
  linkText: {
    color: tokens.color.secondary,
    fontSize: tokens.type.body,
    fontWeight: "900"
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
    fontWeight: "800"
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
    fontWeight: "900"
  },
  timeValue: {
    color: tokens.color.ink,
    fontSize: 44,
    fontWeight: "900",
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
    fontWeight: "900"
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
    borderRadius: tokens.radius.sm,
    backgroundColor: "rgba(255, 255, 255, 0.62)",
    borderWidth: 1,
    borderColor: tokens.color.line
  },
  timeButtonText: {
    color: tokens.color.ink,
    fontSize: 20,
    fontWeight: "900"
  },
  devGenerated: {
    gap: tokens.space.xs,
    marginTop: tokens.space.md,
    marginBottom: tokens.space.md
  },
  devGameText: {
    color: tokens.color.ink,
    fontSize: tokens.type.body,
    fontWeight: "800"
  },
  devActions: {
    gap: tokens.space.sm
  },
  devButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.primary
  },
  devButtonText: {
    color: "white",
    fontSize: tokens.type.body,
    fontWeight: "900"
  },
  devButtonSecondary: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.color.line,
    backgroundColor: "white"
  },
  devButtonSecondaryText: {
    color: tokens.color.ink,
    fontSize: tokens.type.body,
    fontWeight: "900"
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: tokens.space.sm
  },
  premiumBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.primary
  },
  premiumBadgeText: {
    color: "white",
    fontSize: tokens.type.small,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase"
  },
  premiumLocked: {
    gap: tokens.space.sm,
    padding: tokens.space.md,
    borderRadius: tokens.radius.md,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: tokens.color.line
  },
  premiumLockedText: {
    color: tokens.color.ink,
    fontSize: tokens.type.body,
    fontWeight: "700",
    lineHeight: 20
  },
  premiumButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.primary,
    paddingHorizontal: tokens.space.md
  },
  premiumButtonText: {
    color: "white",
    fontSize: tokens.type.body,
    fontWeight: "900"
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
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.line,
    backgroundColor: "rgba(255,255,255,0.62)",
    alignItems: "center"
  },
  frequencyButtonActive: {
    borderColor: tokens.color.primary,
    backgroundColor: tokens.color.primaryLight
  },
  frequencyButtonText: {
    color: tokens.color.ink,
    fontSize: tokens.type.body,
    fontWeight: "800"
  },
  frequencyButtonTextActive: {
    color: tokens.color.primaryDark
  }
});
