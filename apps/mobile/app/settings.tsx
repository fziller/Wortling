import { useRouter } from "expo-router";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { AppCard } from "@/components/AppCard";
import { Screen } from "@/components/Screen";
import { tokens } from "@/design/tokens";

const DWDS_URL = "https://www.dwds.de/lemma/list";
const CC_BY_SA_URL = "https://creativecommons.org/licenses/by-sa/4.0/";

export default function SettingsScreen() {
  const router = useRouter();

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
            <Text style={styles.cardTitle}>Über Wortling</Text>
            <Text style={styles.body}>
              Wortling ist eine mobile Wortspiel-App für deutsche Wörter. Der erste spielbare Modus heißt
              Dazwischen: ein Rätsel mit fünf Buchstaben, bei dem du das Zielwort alphabetisch eingrenzt.
            </Text>
          </AppCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).duration(tokens.motion.normal)}>
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
  linkButton: {
    alignSelf: "flex-start",
    paddingVertical: tokens.space.xs
  },
  linkText: {
    color: tokens.color.secondary,
    fontSize: tokens.type.body,
    fontWeight: "900"
  }
});
