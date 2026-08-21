import * as Application from "expo-application";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { AppCard } from "@/components/AppCard";
import { Screen } from "@/components/Screen";
import { tokens } from "@/design/tokens";
import { loadNotificationSettings, saveNotificationSettings, NotificationSettings } from "@/storage/settings";
import { requestNotificationPermission } from "@/notifications/register";
import { scheduleDailyReminder } from "@/notifications/scheduler";

const DWDS_URL = "https://www.dwds.de/lemma/list";
const CC_BY_SA_URL = "https://creativecommons.org/licenses/by-sa/4.0/";

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    hour: 18,
    minute: 0,
  });

  useEffect(() => {
    loadNotificationSettings().then(setSettings);
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

  function adjustHour(delta: number) {
    const next = { ...settings, hour: (settings.hour + delta + 24) % 24 };
    updateAndReschedule(next);
  }

  function adjustMinute(delta: number) {
    const next = { ...settings, minute: (settings.minute + delta + 60) % 60 };
    updateAndReschedule(next);
  }

  const timeLabel = `${String(settings.hour).padStart(2, "0")}:${String(settings.minute).padStart(2, "0")}`;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(tokens.motion.normal)} style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Zurück</Text>
          </Pressable>
          <Text style={styles.kicker}>Wortling</Text>
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
              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: settings.enabled }}
                onPress={toggleEnabled}
                style={[styles.toggle, settings.enabled && styles.toggleOn]}
              >
                <View style={[styles.toggleKnob, settings.enabled && styles.toggleKnobOn]} />
              </Pressable>
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

        <Animated.View entering={FadeInDown.delay(140).duration(tokens.motion.normal)}>
          <AppCard>
            <Text style={styles.cardTitle}>Über Wortling</Text>
            <Text style={styles.body}>
              Wortling ist eine mobile Wortspiel-App für deutsche Wörter. Der erste spielbare Modus heißt
              Dazwischen: ein Rätsel mit fünf Buchstaben, bei dem du das Zielwort alphabetisch eingrenzt.
            </Text>
            <Text style={styles.versionText}>
              Version {Application.nativeApplicationVersion ?? "?"} (Build {Application.nativeBuildVersion ?? "?"})
            </Text>
          </AppCard>
        </Animated.View>

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
    paddingHorizontal: 3
  },
  toggleOn: {
    backgroundColor: tokens.color.primary
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "white",
    alignSelf: "flex-start"
  },
  toggleKnobOn: {
    alignSelf: "flex-end"
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
  }
});
