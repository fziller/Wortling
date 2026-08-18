import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { AppCard } from "@/components/AppCard";
import { AppButton } from "@/components/AppButton";
import { Screen } from "@/components/Screen";
import { tokens } from "@/design/tokens";
import { games } from "@/games/registry";

const [between] = games;

export default function HomeScreen() {
  return (
    <Screen>
      <Animated.View entering={FadeInUp.duration(tokens.motion.slow)} style={styles.hero}>
        <Text style={styles.kicker}>Heute</Text>
        <Text style={styles.title}>Wortling</Text>
        <Text style={styles.subtitle}>Ein kurzes deutsches Wortraetsel. Kein Account, kein Kram.</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(tokens.motion.slow)}>
        <AppCard>
          <View style={styles.cardTop}>
            <Text style={styles.badge}>5 Buchstaben</Text>
            <Text style={styles.minutes}>{between.estimatedMinutes} Min.</Text>
          </View>
          <Text style={styles.cardTitle}>{between.title}</Text>
          <Text style={styles.cardText}>{between.shortDescription}</Text>
          <View style={styles.rangePreview}>
            <Text style={styles.rangeWord}>aaaaa</Text>
            <View style={styles.rangeLine} />
            <Text style={styles.rangeWord}>zzzzz</Text>
          </View>
          <Link href={between.route} asChild>
            <AppButton label="Spiel starten" onPress={() => undefined} />
          </Link>
        </AppCard>
      </Animated.View>

      <Text style={styles.footer}>Weitere Modi kommen erst, wenn dieser hier wirklich gut ist.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: tokens.space.xl,
    gap: tokens.space.sm
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
  subtitle: {
    color: tokens.color.muted,
    fontSize: tokens.type.body,
    lineHeight: 24
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: tokens.space.lg
  },
  badge: {
    overflow: "hidden",
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.xs,
    borderRadius: tokens.radius.pill,
    backgroundColor: "#FFE2D4",
    color: tokens.color.primaryDark,
    fontWeight: "900"
  },
  minutes: {
    color: tokens.color.muted,
    fontWeight: "800"
  },
  cardTitle: {
    color: tokens.color.ink,
    fontSize: tokens.type.h1,
    fontWeight: "900"
  },
  cardText: {
    marginTop: tokens.space.sm,
    color: tokens.color.muted,
    fontSize: tokens.type.body,
    lineHeight: 24
  },
  rangePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.sm,
    marginVertical: tokens.space.lg
  },
  rangeWord: {
    color: tokens.color.ink,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1
  },
  rangeLine: {
    flex: 1,
    height: 8,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.secondary
  },
  footer: {
    marginTop: "auto",
    color: tokens.color.muted,
    fontSize: tokens.type.small,
    textAlign: "center"
  }
});
